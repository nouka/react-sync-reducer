import { ConnectionState } from '../constants'
import { CustomEventType } from '../types'
import { Config, Connection } from './Connection'

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
    return ConnectionState.PENDING
  }
  public close(): ConnectionState {
    this.dataChannel?.close()
    this.peerConnection?.close()
    return ConnectionState.CLOSED
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
