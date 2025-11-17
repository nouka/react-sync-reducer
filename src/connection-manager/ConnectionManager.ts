import { Socket } from 'socket.io-client'
import { WebRTCConnection, WebRTCOptions } from '../connection/WebRTCConnection'
import {
  ConnectionState,
  DEFAULT_OPTIONS,
  RECEIVE_EVENTS,
  SEND_EVENTS
} from '../constants'
import { WebRTCReceiver } from '../receiver/WebRTCReceiver'
import { WebRTCSender } from '../sender/WebRTCSender'
import { Identifier, ReceiveEventHandlers } from '../types'
import { margeDefaultOptions } from '../utils'
import SocketBuilder, { SocketBuilderOptions } from '../utils/SocketBuilder'

export interface ConnectionManagerOptions {
  roomName: string
  socketBuilderOptions: SocketBuilderOptions
  connectionOptions: WebRTCOptions
}

/**
 * ピア接続を管理するクラス
 */
export class ConnectionManager {
  /**
   * オプション
   */
  private options: ConnectionManagerOptions

  /**
   * ピア接続のリスト
   */
  private connections: Map<Identifier, WebRTCConnection> = new Map()

  /**
   * 送信インスタンス
   */
  private senderInstance: WebRTCSender

  /**
   * 受信インスタンス
   */
  private receiverInstance: WebRTCReceiver

  /**
   * Socket.IOのソケット
   */
  private socket: Socket | undefined

  /**
   * 自分のID
   */
  private id: Identifier

  /**
   * ホストのID
   */
  private hostId: Identifier

  constructor(options?: Partial<ConnectionManagerOptions>) {
    this.options = margeDefaultOptions(DEFAULT_OPTIONS, options)
    this.senderInstance = new WebRTCSender()
    this.receiverInstance = new WebRTCReceiver()
    this.id = ''
    this.hostId = ''
  }

  /**
   * シグナリングサーバーに接続する
   *
   * @returns
   */
  public connect = async (): Promise<ConnectionState> => {
    const { socketBuilderOptions, roomName } = this.options
    return new Promise<ConnectionState>((resolve, reject) => {
      SocketBuilder.registerHandlers(this.makeHandlers(resolve, reject))
        .build(socketBuilderOptions)
        .then(({ socket, id }) => {
          this.socket = socket
          this.id = id
          console.debug('connected to signaling server. my id=', this.id)

          // 自動的にJOIN
          socket.emit(SEND_EVENTS.ENTER, roomName)
        })
    })
  }

  /**
   * 接続を閉じる
   *
   * @returns
   */
  public close = (): ConnectionState => {
    this.socket?.emit(SEND_EVENTS.EXIT)
    this.socket?.close()
    this.closePeerConnections()
    return ConnectionState.CLOSED
  }

  /**
   * シグナリングサーバーのイベントハンドラを作成する
   *
   * @param resolve 正常終了のコールバック
   * @param reject 異常終了のコールバック
   * @returns
   */
  private makeHandlers = (
    resolve: (value: ConnectionState | PromiseLike<ConnectionState>) => void,
    reject: (reason?: unknown) => void
  ) => {
    const handlers: ReceiveEventHandlers = new Set()

    // 接続完了時
    handlers.add({
      type: RECEIVE_EVENTS.CONNECTED,
      handler: (socket, res, data) => {
        res({ socket, id: data.id })
      }
    })

    // 切断などで退室ユーザーを確認した場合
    handlers.add({
      type: RECEIVE_EVENTS.DISCONNECTED,
      handler: (data) => {
        console.debug(RECEIVE_EVENTS.DISCONNECTED, data)
        this.closePeerConnection(data.id)
      }
    })

    // ホストの通知を受け取ったとき
    handlers.add({
      type: RECEIVE_EVENTS.YOU_HOST,
      handler: () => {
        this.hostId = this.id
      }
    })

    // Join Roomを受け付けてオファーを作成し送り返す
    handlers.add({
      type: RECEIVE_EVENTS.JOINED,
      handler: async (socket, data) => {
        console.debug(RECEIVE_EVENTS.JOINED, data)
        const conn = this.getConnection(data.id, (evt) => {
          socket.emit(SEND_EVENTS.CANDIDATE, {
            target: data.id,
            ice: evt.candidate
          })
        })
        const peerConnection = await conn.makeOfferToPeer()
        if (!peerConnection) return
        socket.emit(SEND_EVENTS.SDP, {
          target: data.id,
          sdp: peerConnection.localDescription,
          isHost: this.hostId === this.id
        })
      }
    })

    // SDPの受け付け
    // オファーの場合はアンサーを作成して送り返す
    // アンサーの場合はremoteDescriptionにセットして終了
    handlers.add({
      type: RECEIVE_EVENTS.SDP,
      handler: async (socket, sdp) => {
        console.debug(RECEIVE_EVENTS.SDP, sdp)
        switch (sdp.type) {
          case 'offer': {
            // Peer Connection を生成
            const conn = this.getConnection(sdp.id, (evt) => {
              socket.emit(SEND_EVENTS.CANDIDATE, {
                target: sdp.id,
                ice: evt.candidate
              })
            })
            const peerConnection = await conn.receiveOfferFromPeer(sdp)
            if (!peerConnection) return
            socket.emit(SEND_EVENTS.SDP, {
              target: sdp.id,
              sdp: peerConnection.localDescription
            })
            return
          }
          case 'answer': {
            const conn = this.connections.get(sdp.id)
            if (!conn) return
            await conn.receiveAnswerFromPeer(sdp)
            socket.emit(SEND_EVENTS.COMPLETE)
            resolve(ConnectionState.CONNECTED)
            return
          }
          default:
            console.error('unknown sdp...')
            reject('unknown sdp...')
            return
        }
      }
    })

    // ICE CANDIDATEの受け付け
    handlers.add({
      type: RECEIVE_EVENTS.CANDIDATE,
      handler: async (ice) => {
        console.debug(RECEIVE_EVENTS.CANDIDATE, ice)
        const conn = this.connections.get(ice.id)
        if (!conn) return
        await conn.receiveCandidateFromPeer(ice)
      }
    })

    // 接続相手からの完了通知
    handlers.add({
      type: RECEIVE_EVENTS.COMPLETED,
      handler: ({ hostId }) => {
        if (hostId) this.hostId = hostId
        resolve(ConnectionState.CONNECTED)
      }
    })

    return handlers
  }

  /**
   * ピア接続のClose
   *
   * @param id 切断された相手のID
   * @returns
   */
  private closePeerConnection = (id: Identifier) => {
    const connection = this.connections.get(id)
    if (!connection) return
    connection.close()
    this.connections.delete(id)
  }

  /**
   * 全ピア接続のClose
   *
   * @returns
   */
  private closePeerConnections = () => {
    this.connections.forEach((connection) => {
      connection.close()
    })
    this.connections.clear()
  }

  /**
   * 接続の取得または新規作成
   *
   * @param id 接続先のID
   * @param onIceCandidate ICE candidate イベントハンドラ
   * @returns
   */
  private getConnection = (
    id: Identifier,
    onIceCandidate: (evt: RTCPeerConnectionIceEvent) => void
  ) => {
    const cached = this.connections.get(id)
    if (cached) return cached

    const { connectionOptions } = this.options
    const connection = new WebRTCConnection({
      ...connectionOptions,
      onIceCandidate
    })
    this.connections.set(id, connection)
    return connection
  }

  get sender() {
    this.senderInstance.connections = this.connections
    return this.senderInstance
  }
  get receiver() {
    return this.receiverInstance
  }
  get host() {
    return this.hostId
  }
  get me() {
    return this.id
  }
  get isHost() {
    return this.id === this.hostId
  }
}
