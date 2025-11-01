import { CustomEventType, Identifier } from '../types'
import { margeDefaultOptions } from '../utils'
import { Connection } from './Connection'

export interface WebRTCOptions {
  onIceCandidate: (evt: RTCPeerConnectionIceEvent) => void
  peerConnectionOptions: RTCConfiguration
  dataChannelLabel: string
  dataChannelOptions: RTCDataChannelInit
}

export class WebRTCConnection implements Connection {
  private options: WebRTCOptions
  private defaultOptions: WebRTCOptions = {
    onIceCandidate: (_evt: RTCPeerConnectionIceEvent): void => {},
    peerConnectionOptions: {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    },
    dataChannelLabel: 'default-data-channel',
    dataChannelOptions: {
      ordered: true
    }
  }

  private peerConnection: RTCPeerConnection
  private dataChannel: RTCDataChannel | undefined

  constructor(options?: Partial<WebRTCOptions>) {
    this.options = margeDefaultOptions(this.defaultOptions, options)
    this.peerConnection = this.createPeerConnection()
  }

  public close() {
    this.dataChannel?.close()
    this.peerConnection?.close()
  }

  /**
   * ピア接続を作成しオファーを送信する
   * 通信の最初のシーケンス
   *
   * @param id 通信相手のID
   * @param onIceCandidate ICE CANDIDATEのハンドラ
   * @returns
   */
  public makeOfferToPeer = async () => {
    // Data channel を生成
    this.createDataChannel()

    try {
      const sessionDescription = await this.peerConnection.createOffer()
      console.debug('createOffer() succeeded.')
      await this.peerConnection.setLocalDescription(sessionDescription)
      // setLocalDescription() が成功した場合
      // Trickle ICE ではここで SDP を相手に通知する
      // Vanilla ICE では ICE candidate が揃うのを待つ
      console.debug('setLocalDescription() succeeded.')
      return this.peerConnection
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
    sdp: RTCSessionDescription & { id: Identifier }
  ) => {
    let offer = new RTCSessionDescription(sdp)
    try {
      await this.peerConnection.setRemoteDescription(offer)
      console.debug('setRemoteDescription() succeeded.')
    } catch (err) {
      console.error('setRemoteDescription() failed.', err)
    }
    // Answer を生成
    try {
      const sessionDescription = await this.peerConnection.createAnswer()
      console.debug('createAnswer() succeeded.')
      await this.peerConnection.setLocalDescription(sessionDescription)
      // setLocalDescription() が成功した場合
      // Trickle ICE ではここで SDP を相手に通知する
      // Vanilla ICE では ICE candidate が揃うのを待つ
      console.debug('setLocalDescription() succeeded.')
      return this.peerConnection
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
    sdp: RTCSessionDescription & { id: Identifier }
  ) => {
    let answer = new RTCSessionDescription(sdp)
    try {
      await this.peerConnection.setRemoteDescription(answer)
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
    ice: RTCIceCandidate & { id: Identifier }
  ) => {
    const candidate = new RTCIceCandidate(ice)
    this.peerConnection.addIceCandidate(candidate)
  }

  /**
   * 新しい RTCPeerConnection を作成する
   *
   * @param id 通信相手のID
   * @param onIceCandidate ICE CANDIDATEのハンドラ
   * @returns
   */
  private createPeerConnection = () => {
    const { onIceCandidate, peerConnectionOptions } = this.options
    let pc = new RTCPeerConnection(peerConnectionOptions)

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

  private createDataChannel = () => {
    const { dataChannelLabel, dataChannelOptions } = this.options
    const dataChannel = this.peerConnection.createDataChannel(
      dataChannelLabel,
      dataChannelOptions
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
