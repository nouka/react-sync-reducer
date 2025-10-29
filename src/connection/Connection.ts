import { Socket } from 'socket.io-client'
import SocketBuilder from '../adapters/SocketBuilder'
import { Receiver, WebRTCReceiver } from '../receiver/Receiver'
import { Sender, WebRTCSender } from '../sender/Sender'
import { CustomEventType, Identifier, Peers } from '../types'

export const State = {
  CLOSED: 'CLOSED',
  CONNECTED: 'CONNECTED',
  PENDING: 'PENDING'
} as const

export type ConnectionState = (typeof State)[keyof typeof State]
export interface Config {}
export interface Connection {
  connect(config: Config): Promise<ConnectionState>
  close(): ConnectionState
  get sender(): Sender
  get receiver(): Receiver
  get host(): Identifier | undefined
  get isHost(): boolean
}

export interface WebRTCConfig extends Config {
  roomName: string
}
export class WebRTCConnection implements Connection {
  /**
   * ピア接続のリスト
   */
  private peers: Peers = new Map()
  /**
   * ICE server URLs
   */
  private peerConnectionConfig: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  }
  /**
   * Data channel オプション
   */
  private dataChannelOptions: RTCDataChannelInit = {
    ordered: false
  }
  private senderInstance: WebRTCSender
  private receiverInstance: WebRTCReceiver
  private socket: Socket | undefined
  private id: Identifier | undefined
  private hostId: Identifier | undefined
  constructor() {
    this.senderInstance = new WebRTCSender()
    this.receiverInstance = new WebRTCReceiver()
  }
  public connect = (config: WebRTCConfig): Promise<ConnectionState> => {
    return new Promise<ConnectionState>((resolve) => {
      SocketBuilder.build().then(({ socket, id }) => {
        this.socket = socket
        this.id = id
        console.log('connected to signaling server. my id=', this.id)

        // 自動的にJOIN
        this.socket?.emit('SEND_ENTER', config.roomName)

        // 切断などで退室ユーザーを確認した場合
        this.socket?.on('LEAVE_USER', (data) => {
          console.log('LEAVE_USER', data)
          this.closePeerConnection(data.id)
        })

        // Join Roomを受け付けてオファーを作成し送り返す
        this.socket?.on('RECEIVE_CALL', async (data) => {
          console.log('RECEIVE_CALL', data)
          const peerConnection = await this.makeOfferToPeer(data.id, (evt) => {
            this.socket?.emit('SEND_CANDIDATE', {
              target: data.id,
              ice: evt.candidate
            })
          })
          if (!peerConnection) return
          this.socket?.emit('SEND_SDP', {
            target: data.id,
            sdp: peerConnection.localDescription
          })
        })

        // SDPの受け付け
        // オファーの場合はアンサーを作成して送り返す
        // アンサーの場合はremoteDescriptionにセットして終了
        this.socket?.on('RECEIVE_SDP', async (sdp) => {
          console.log('RECEIVE_SDP', sdp)
          switch (sdp.type) {
            case 'offer': {
              const peerConnection = await this.receiveOfferFromPeer(
                sdp,
                (evt) => {
                  this.socket?.emit('SEND_CANDIDATE', {
                    target: sdp.id,
                    ice: evt.candidate
                  })
                }
              )
              if (!peerConnection) return
              this.socket?.emit('SEND_SDP', {
                target: sdp.id,
                sdp: peerConnection.localDescription
              })
              return
            }
            case 'answer':
              await this.receiveAnswerFromPeer(sdp)
              this.socket?.emit('START_GAME')
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
        this.socket?.on('RECEIVE_CANDIDATE', (ice) => {
          console.log('RECEIVE_CANDIDATE', ice)
          this.receiveCandidateFromPeer(ice)
        })

        // ホストのゲーム開始を受けて、クライアントがゲームを起動する処理
        this.socket?.on('STARTED_GAME', (id) => {
          this.hostId = id
          resolve(State.CONNECTED)
        })
      })
    })
  }
  public close = (): ConnectionState => {
    this.socket?.emit('SEND_EXIT')
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
    const peerConnection =
      this.peers.get(id)?.pc ?? this.createPeerConnection(id, onIceCandidate)

    // Data channel を生成
    const dataChannel = peerConnection.createDataChannel(
      'test-data-channel',
      this.dataChannelOptions
    )
    this.setupDataChannel(dataChannel)

    if (!this.peers.get(id)?.pc) {
      this.peers.set(id, { pc: peerConnection, dc: dataChannel })
    }

    try {
      const sessionDescription = await peerConnection.createOffer()
      console.debug('createOffer() succeeded.')
      await peerConnection.setLocalDescription(sessionDescription)
      // setLocalDescription() が成功した場合
      // Trickle ICE ではここで SDP を相手に通知する
      // Vanilla ICE では ICE candidate が揃うのを待つ
      console.debug('setLocalDescription() succeeded.')
      return peerConnection
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
    const peerConnection =
      this.peers.get(sdp.id)?.pc ??
      this.createPeerConnection(sdp.id, onIceCandidate)
    if (!this.peers.get(sdp.id)?.pc) {
      const peer = this.peers.get(sdp.id)
      this.peers.set(sdp.id, { ...peer, pc: peerConnection })
    }

    let offer = new RTCSessionDescription(sdp)
    try {
      await peerConnection.setRemoteDescription(offer)
      console.debug('setRemoteDescription() succeeded.')
    } catch (err) {
      console.error('setRemoteDescription() failed.', err)
    }
    // Answer を生成
    try {
      const sessionDescription = await peerConnection.createAnswer()
      console.debug('createAnswer() succeeded.')
      await peerConnection.setLocalDescription(sessionDescription)
      // setLocalDescription() が成功した場合
      // Trickle ICE ではここで SDP を相手に通知する
      // Vanilla ICE では ICE candidate が揃うのを待つ
      console.debug('setLocalDescription() succeeded.')
      return peerConnection
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
    const peerConnection = this.peers.get(sdp.id)?.pc
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
    const peerConnection = this.peers.get(ice.id)?.pc
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
  public closePeerConnection = (id: Identifier) => {
    const peer = this.peers.get(id)
    if (!peer) return
    peer.dc?.close()
    peer.pc?.close()
    this.peers.delete(id)
  }

  /**
   * 新しい RTCPeerConnection を作成する
   *
   * @param id 通信相手のID
   * @param onIceCandidate ICE CANDIDATEのハンドラ
   * @returns
   */
  private createPeerConnection = (
    id: Identifier,
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
      const peer = this.peers.get(id)
      this.peers.set(id, { ...peer, dc: evt.channel })
    }

    return pc
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
  get sender() {
    this.senderInstance.connections = this.peers
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
