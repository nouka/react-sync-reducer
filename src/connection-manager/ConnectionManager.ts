import { Socket } from 'socket.io-client'
import SocketBuilder, { EVENTS } from '../adapters/SocketBuilder'
import { WebRTCConnection } from '../connection/WebRTCConnection'
import { ConnectionState } from '../constants'
import { WebRTCReceiver } from '../receiver/WebRTCReceiver'
import { WebRTCSender } from '../sender/WebRTCSender'
import { Identifier } from '../types'

// TODO: interface, 定数の分離

export interface ConnectionManagerConfig {
  roomName: string
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
    return new Promise<ConnectionState>((resolve) => {
      const handlers = new Map()
      // 接続完了時
      handlers.set(EVENTS.RECEIVE_CONNECTED, (socket, res, data) => {
        res({ socket, id: data.id })
      })
      // 切断などで退室ユーザーを確認した場合
      handlers.set(EVENTS.LEAVE_USER, (data) => {
        console.log('LEAVE_USER', data)
        this.closePeerConnection(data.id)
      })
      // Join Roomを受け付けてオファーを作成し送り返す
      handlers.set(EVENTS.RECEIVE_CALL, async (socket, data) => {
        console.log('RECEIVE_CALL', data)
        const peerConnection = await this.makeOfferToPeer(data.id, (evt) => {
          socket.emit('SEND_CANDIDATE', {
            target: data.id,
            ice: evt.candidate
          })
        })
        if (!peerConnection) return
        socket.emit('SEND_SDP', {
          target: data.id,
          sdp: peerConnection.localDescription
        })
      })
      // SDPの受け付け
      // オファーの場合はアンサーを作成して送り返す
      // アンサーの場合はremoteDescriptionにセットして終了
      handlers.set(EVENTS.RECEIVE_SDP, async (socket, sdp) => {
        console.log('RECEIVE_SDP', sdp)
        switch (sdp.type) {
          case 'offer': {
            const peerConnection = await this.receiveOfferFromPeer(
              sdp,
              (evt) => {
                socket.emit('SEND_CANDIDATE', {
                  target: sdp.id,
                  ice: evt.candidate
                })
              }
            )
            if (!peerConnection) return
            socket.emit('SEND_SDP', {
              target: sdp.id,
              sdp: peerConnection.localDescription
            })
            return
          }
          case 'answer':
            await this.receiveAnswerFromPeer(sdp)
            socket.emit('START_GAME')
            this.id && (this.hostId = this.id)
            resolve(ConnectionState.CONNECTED)
            return
          default:
            console.log('unkown sdp...')
            resolve(ConnectionState.PENDING)
            return
        }
      })
      // ICE CANDIDATEの受け付け
      handlers.set(EVENTS.RECEIVE_CANDIDATE, (ice) => {
        console.log('RECEIVE_CANDIDATE', ice)
        this.receiveCandidateFromPeer(ice)
      })
      // ホストのゲーム開始を受けて、クライアントがゲームを起動する処理
      handlers.set(EVENTS.STARTED_GAME, (id) => {
        this.hostId = id
        resolve(ConnectionState.CONNECTED)
      })
      SocketBuilder.registerHandlers(handlers)
        .build()
        .then(({ socket, id }) => {
          this.socket = socket
          this.id = id
          console.log('connected to signaling server. my id=', this.id)

          // 自動的にJOIN
          socket.emit('SEND_ENTER', config.roomName)
        })
    })
  }
  public close = (): ConnectionState => {
    this.socket?.emit('SEND_EXIT')
    this.socket?.close()
    this.closePeerConnections()
    return ConnectionState.CLOSED
  }
  /**
   * ピア接続を作成しオファーを送信する
   * 通信の最初のシーケンス
   *
   * @param id 通信相手のID
   * @param onIceCandidate ICE CANDIDATEのハンドラ
   * @returns
   */
  public makeOfferToPeer = async (
    id: Identifier,
    onIceCandidate: (evt: RTCPeerConnectionIceEvent) => void
  ) => {
    const conn = this.getConnection(id, onIceCandidate)

    // Data channel を生成
    conn.createDataChannel()

    try {
      const sessionDescription = await conn.pc.createOffer()
      console.debug('createOffer() succeeded.')
      await conn.pc.setLocalDescription(sessionDescription)
      // setLocalDescription() が成功した場合
      // Trickle ICE ではここで SDP を相手に通知する
      // Vanilla ICE では ICE candidate が揃うのを待つ
      console.debug('setLocalDescription() succeeded.')
      return conn.pc
    } catch (err) {
      console.error('setLocalDescription() failed.', err)
    }
    return
  }

  /**
   * オファーを受けてアンサーを作成する
   * 2番目のシーケンス
   *
   * @param sdp オファー（SDP）
   * @param onIceCandidate ICE CANDIDATEのハンドラ
   * @returns
   */
  public receiveOfferFromPeer = async (
    sdp: RTCSessionDescription & { id: Identifier },
    onIceCandidate: (evt: RTCPeerConnectionIceEvent) => void
  ) => {
    // Peer Connection を生成
    const conn = this.getConnection(sdp.id, onIceCandidate)

    let offer = new RTCSessionDescription(sdp)
    try {
      await conn.pc.setRemoteDescription(offer)
      console.debug('setRemoteDescription() succeeded.')
    } catch (err) {
      console.error('setRemoteDescription() failed.', err)
    }
    // Answer を生成
    try {
      const sessionDescription = await conn.pc.createAnswer()
      console.debug('createAnswer() succeeded.')
      await conn.pc.setLocalDescription(sessionDescription)
      // setLocalDescription() が成功した場合
      // Trickle ICE ではここで SDP を相手に通知する
      // Vanilla ICE では ICE candidate が揃うのを待つ
      console.debug('setLocalDescription() succeeded.')
      return conn.pc
    } catch (err) {
      console.error('setLocalDescription() failed.', err)
    } finally {
      console.log('answer created')
    }
    return
  }

  /**
   * アンサーを受ける
   * 3番目のシーケンス
   *
   * @param sdp アンサー（SDP）
   * @returns
   */
  public receiveAnswerFromPeer = async (
    sdp: RTCSessionDescription & { id: string }
  ) => {
    const peerConnection = this.connections.get(sdp.id)?.pc
    if (!peerConnection) return
    let answer = new RTCSessionDescription(sdp)
    try {
      await peerConnection.setRemoteDescription(answer)
      console.debug('setRemoteDescription() succeeded.')
    } catch (err) {
      console.error('setRemoteDescription() failed.', err)
    }
  }

  /**
   * ICE CANDIDATEを受け取り追加する
   *
   * @param ice ICE CANDIDATE
   * @returns
   */
  public receiveCandidateFromPeer = async (
    ice: RTCIceCandidate & { id: string }
  ) => {
    const peerConnection = this.connections.get(ice.id)?.pc
    if (!peerConnection) return
    const candidate = new RTCIceCandidate(ice)
    peerConnection.addIceCandidate(candidate)
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
