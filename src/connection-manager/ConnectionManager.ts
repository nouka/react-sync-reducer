import { Socket } from 'socket.io-client'
import SocketBuilder, {
  EMIT_EVENTS,
  EVENTS,
  SocketBuilderOptions
} from '../adapters/SocketBuilder'
import { WebRTCConnection } from '../connection/WebRTCConnection'
import { ConnectionState } from '../constants'
import { WebRTCReceiver } from '../receiver/WebRTCReceiver'
import { WebRTCSender } from '../sender/WebRTCSender'
import { Identifier } from '../types'

// TODO: interface, 定数の分離

export interface ConnectionManagerConfig {
  roomName: string
  socketBuilderOptions?: SocketBuilderOptions
}

export class ConnectionManager {
  /**
   * ピア接続のリスト
   */
  private connections: Map<Identifier, WebRTCConnection> = new Map()
  private senderInstance: WebRTCSender
  private receiverInstance: WebRTCReceiver
  private socket: Socket | undefined
  private id: Identifier | undefined
  private hostId: Identifier | undefined
  constructor() {
    this.senderInstance = new WebRTCSender()
    this.receiverInstance = new WebRTCReceiver()
  }

  public connect = async (
    config: ConnectionManagerConfig
  ): Promise<ConnectionState> => {
    return new Promise<ConnectionState>((resolve, reject) => {
      SocketBuilder.registerHandlers(this.makeHandlers(resolve, reject))
        .build(config.socketBuilderOptions)
        .then(({ socket, id }) => {
          this.socket = socket
          this.id = id
          console.debug('connected to signaling server. my id=', this.id)

          // 自動的にJOIN
          socket.emit(EMIT_EVENTS.SEND_ENTER, config.roomName)
        })
    })
  }

  public close = (): ConnectionState => {
    this.socket?.emit(EMIT_EVENTS.SEND_EXIT)
    this.socket?.close()
    this.closePeerConnections()
    return ConnectionState.CLOSED
  }

  private makeHandlers = (
    resolve: (value: ConnectionState | PromiseLike<ConnectionState>) => void,
    reject: (reason?: any) => void
  ) => {
    const handlers = new Map()

    // 接続完了時
    handlers.set(EVENTS.RECEIVE_CONNECTED, (socket, res, data) => {
      res({ socket, id: data.id })
    })

    // 切断などで退室ユーザーを確認した場合
    handlers.set(EVENTS.LEAVE_USER, (data) => {
      console.debug(EVENTS.LEAVE_USER, data)
      this.closePeerConnection(data.id)
    })

    // Join Roomを受け付けてオファーを作成し送り返す
    handlers.set(EVENTS.RECEIVE_CALL, async (socket, data) => {
      console.debug(EVENTS.RECEIVE_CALL, data)
      const conn = this.getConnection(data.id, (evt) => {
        socket.emit(EMIT_EVENTS.SEND_CANDIDATE, {
          target: data.id,
          ice: evt.candidate
        })
      })
      const peerConnection = await conn.makeOfferToPeer()
      if (!peerConnection) return
      socket.emit(EMIT_EVENTS.SEND_SDP, {
        target: data.id,
        sdp: peerConnection.localDescription
      })
    })

    // SDPの受け付け
    // オファーの場合はアンサーを作成して送り返す
    // アンサーの場合はremoteDescriptionにセットして終了
    handlers.set(EVENTS.RECEIVE_SDP, async (socket, sdp) => {
      console.debug(EVENTS.RECEIVE_SDP, sdp)
      switch (sdp.type) {
        case 'offer': {
          // Peer Connection を生成
          const conn = this.getConnection(sdp.id, (evt) => {
            socket.emit(EMIT_EVENTS.SEND_CANDIDATE, {
              target: sdp.id,
              ice: evt.candidate
            })
          })
          const peerConnection = await conn.receiveOfferFromPeer(sdp)
          if (!peerConnection) return
          socket.emit(EMIT_EVENTS.SEND_SDP, {
            target: sdp.id,
            sdp: peerConnection.localDescription
          })
          return
        }
        case 'answer':
          const conn = this.connections.get(sdp.id)
          if (!conn) return
          await conn.receiveAnswerFromPeer(sdp)
          socket.emit(EMIT_EVENTS.START_GAME)
          this.id && (this.hostId = this.id)
          resolve(ConnectionState.CONNECTED)
          return
        default:
          console.error('unkown sdp...')
          reject('unkown sdp...')
          return
      }
    })

    // ICE CANDIDATEの受け付け
    handlers.set(EVENTS.RECEIVE_CANDIDATE, async (ice) => {
      console.debug(EVENTS.RECEIVE_CANDIDATE, ice)
      const conn = this.connections.get(ice.id)
      if (!conn) return
      await conn.receiveCandidateFromPeer(ice)
    })

    // ホストのゲーム開始を受けて、クライアントがゲームを起動する処理
    handlers.set(EVENTS.STARTED_GAME, (id) => {
      this.hostId = id
      resolve(ConnectionState.CONNECTED)
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

  private closePeerConnections = () => {
    this.connections.forEach((connection) => {
      connection.close()
    })
    this.connections.clear()
  }

  private getConnection = (
    id: Identifier,
    onIceCandidate: (evt: RTCPeerConnectionIceEvent) => void
  ) => {
    const cached = this.connections.get(id)
    if (cached) return cached

    const connection = new WebRTCConnection({ onIceCandidate })
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
  get isHost() {
    return this.id === this.hostId
  }
}
