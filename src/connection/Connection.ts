import { Socket } from 'socket.io-client'
import SocketBuilder, { EVENTS } from '../adapters/SocketBuilder'
import { Receiver, WebRTCReceiver } from '../receiver/Receiver'
import { Sender, WebRTCSender } from '../sender/Sender'
import { CustomEventType, Identifier } from '../types'

// TODO: interface, 定数の分離
export const State = {
  CLOSED: 'CLOSED',
  CONNECTED: 'CONNECTED',
  PENDING: 'PENDING'
} as const

export type ConnectionState = (typeof State)[keyof typeof State]
export interface Config {}
export interface Connection {
  connect(config: Config): ConnectionState
  close(): ConnectionState
}
export interface ConnectionManager {
  connect(config: Config): Promise<ConnectionState>
  close(): ConnectionState
  get sender(): Sender
  get receiver(): Receiver
  get host(): Identifier | undefined
  get isHost(): boolean
}

export interface ConnectionManagerConfig {
  roomName: string
}
export interface WebRTCConfig extends Config, RTCConfiguration {
  onIceCandidate: (evt: RTCPeerConnectionIceEvent) => void
}
export class WebRTCConnection implements Connection {
  private peerConnection: RTCPeerConnection
  private dataChannel: RTCDataChannel | undefined
  /**
   * ICE server URLs
   * TODO: Configから変更可能にする
   */
  private peerConnectionConfig: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  }
  /**
   * Data channel オプション
   * TODO: Senderに移動し、Configから変更可能にする
   */
  private dataChannelOptions: RTCDataChannelInit = {
    ordered: false
  }
  constructor(config: WebRTCConfig) {
    this.peerConnection = this.createPeerConnection(config.onIceCandidate)
  }
  public connect(config: WebRTCConfig): ConnectionState {
    const { onIceCandidate } = config
    this.peerConnection = this.createPeerConnection(onIceCandidate)
    return State.PENDING
  }
  public close(): ConnectionState {
    this.dataChannel?.close()
    this.peerConnection?.close()
    return State.CLOSED
  }
  /**
   * 新しい RTCPeerConnection を作成する
   *
   * @param id 通信相手のID
   * @param onIceCandidate ICE CANDIDATEのハンドラ
   * @returns
   */
  private createPeerConnection = (
    onIceCandidate: (evt: RTCPeerConnectionIceEvent) => void
  ) => {
    let pc = new RTCPeerConnection(this.peerConnectionConfig)

    // ICE candidate 取得時のイベントハンドラを登録
    pc.onicecandidate = async (evt) => {
      if (evt.candidate) {
        // 一部の ICE candidate を取得
        // Trickle ICE では ICE candidate を相手に通知する
        console.debug(evt.candidate)
        onIceCandidate(evt)
        console.log('Collecting ICE candidates')
      } else {
        // 全ての ICE candidate の取得完了（空の ICE candidate イベント）
        // Vanilla ICE では，全てのICE candidate を含んだ SDP を相手に通知する
        // （SDP は pc.localDescription.sdp で取得できる）
        // 今回は手動でシグナリングするため textarea に SDP を表示する
        console.log('Vanilla ICE ready')
      }
    }

    pc.onconnectionstatechange = async (_evt) => {
      switch (pc.connectionState) {
        case 'connected':
          console.log('connected')
          break
        case 'disconnected':
        case 'failed':
          console.log('disconnected')
          break
        case 'closed':
          console.log('closed')
          break
      }
    }

    pc.ondatachannel = (evt) => {
      console.debug('Data channel created:', evt)
      this.setupDataChannel(evt.channel)
      this.dataChannel = evt.channel
    }

    return pc
  }

  public createDataChannel = () => {
    const dataChannel = this.peerConnection.createDataChannel(
      'test-data-channel',
      this.dataChannelOptions
    )
    this.setupDataChannel(dataChannel)
    this.dataChannel = dataChannel
  }

  /**
   * Data channel のイベントハンドラを定義する
   *
   * @param dc DATA CHANNEL
   */
  private setupDataChannel = (dc: RTCDataChannel) => {
    dc.onerror = function (error) {
      console.error('Data channel error:', error)
    }
    dc.onmessage = function (evt) {
      console.info('Data channel message:', evt.data)
      const event = new CustomEvent(CustomEventType.ON_DATA_CHANNEL_MESSAGE, {
        detail: evt.data
      })
      window.dispatchEvent(event)
    }
    dc.onopen = function (evt) {
      console.debug('Data channel opened:', evt)
    }
    dc.onclose = function () {
      console.debug('Data channel closed.')
    }
  }
  get pc() {
    return this.peerConnection
  }
  get dc() {
    if (!this.dataChannel) {
      throw new Error('Data channel is not established yet.')
    }
    return this.dataChannel
  }
  set pc(peerConnection: RTCPeerConnection) {
    this.peerConnection = peerConnection
  }
  set dc(dataChannel: RTCDataChannel) {
    this.dataChannel = dataChannel
  }
}
export class WebRTCConnectionManager implements ConnectionManager {
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
            resolve(State.CONNECTED)
            return
          default:
            console.log('unkown sdp...')
            resolve(State.PENDING)
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
        resolve(State.CONNECTED)
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
    return State.CLOSED
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
