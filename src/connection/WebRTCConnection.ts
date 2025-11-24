import { CustomEventType, WebRTCOptions } from '../types'
import { Connection } from './Connection'

/**
 * WebRTCによるピア接続を管理するクラス
 */
export class WebRTCConnection implements Connection {
  private options: WebRTCOptions

  private _pc: RTCPeerConnection
  private _dc: RTCDataChannel | undefined

  constructor(options: WebRTCOptions) {
    this.options = options
    this._pc = this.createPeerConnection()
  }

  /**
   * ピア接続を閉じる
   */
  public close() {
    this._dc?.close()
    this._pc.close()
  }

  /**
   * 新しい RTCPeerConnection を作成する
   *
   * @returns RTCPeerConnection
   */
  private createPeerConnection = () => {
    const { onIceCandidate, peerConnectionOptions } = this.options
    const pc = new RTCPeerConnection(peerConnectionOptions)

    // ICE candidate 取得時のイベントハンドラを登録
    pc.onicecandidate = async (evt) => {
      if (evt.candidate) {
        onIceCandidate(evt)
      }
    }

    pc.onconnectionstatechange = async (_evt) => {
      void _evt
      switch (pc.connectionState) {
        case 'connected':
          console.debug('connected')
          break
        case 'disconnected':
        case 'failed':
          console.debug('disconnected')
          break
        case 'closed':
          console.debug('closed')
          break
      }
    }

    pc.ondatachannel = (evt) => {
      console.debug('Data channel created:', evt)
      this.setupDataChannel(evt.channel)
      this._dc = evt.channel
    }

    return pc
  }

  /**
   * Data channel を作成する
   */
  public createDataChannel = () => {
    const { dataChannelLabel, dataChannelOptions } = this.options
    const dataChannel = this._pc.createDataChannel(
      dataChannelLabel,
      dataChannelOptions
    )
    this.setupDataChannel(dataChannel)
    this._dc = dataChannel
  }

  /**
   * Data channel のイベントハンドラを定義する
   *
   * @param dc Data channel
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
    return this._pc
  }
  get dc() {
    if (!this._dc) {
      throw new Error('Data channel is not established yet.')
    }
    return this._dc
  }
}
