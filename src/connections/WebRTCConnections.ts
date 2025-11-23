import { WebRTCConnection, WebRTCOptions } from '../connection/WebRTCConnection'
import { CONNECTION_STATE } from '../constants'
import { CustomEventType, Identifier } from '../types'
import { customEventListener } from '../utils'
import { Connections } from './Connections'

type Options = Omit<WebRTCOptions, 'onIceCandidate'>

export class WebRTCConnections implements Connections {
  private connections: Map<Identifier, WebRTCConnection> = new Map()
  private options: Options

  private _state: keyof typeof CONNECTION_STATE = CONNECTION_STATE.CLOSED
  private _me: Identifier = ''
  private _host: Identifier = ''

  constructor(options: Options) {
    this.options = options
  }

  /**
   * ピア接続を作成しオファーを送信する
   * 通信の最初のシーケンス
   *
   * @param id 相手のID
   * @param onIceCandidate ICE Candidate取得時のコールバック
   * @returns
   */
  public join = async (
    id: Identifier,
    onIceCandidate: (evt: RTCPeerConnectionIceEvent) => void
  ) => {
    const conn = this.getConnection(id, onIceCandidate)

    // Data channel を生成
    conn.createDataChannel()

    const sessionDescription = await conn.pc.createOffer()
    await conn.pc.setLocalDescription(sessionDescription)
    return conn.pc
  }

  /**
   * オファーを受けてアンサーを作成する
   * 2番目のシーケンス
   *
   * @param sdp オファー（SDP）
   * @returns
   */
  public offer = async (
    sdp: RTCSessionDescription & {
      id: Identifier
    },
    onIceCandidate: (evt: RTCPeerConnectionIceEvent) => void
  ) => {
    const conn = this.getConnection(sdp.id, onIceCandidate)

    const offer = new RTCSessionDescription(sdp)
    await conn.pc.setRemoteDescription(offer)

    // Answer を生成
    const sessionDescription = await conn.pc.createAnswer()
    await conn.pc.setLocalDescription(sessionDescription)
    return conn.pc
  }

  /**
   * アンサーを受ける
   * 3番目のシーケンス
   *
   * @param sdp アンサー（SDP）
   * @returns
   */
  public answer = async (
    sdp: RTCSessionDescription & {
      id: Identifier
    }
  ) => {
    const conn = this.connections.get(sdp.id)
    if (!conn) return
    const answer = new RTCSessionDescription(sdp)
    await conn.pc.setRemoteDescription(answer)
  }

  /**
   * ICE CANDIDATEを受け取り追加する
   *
   * @param ice ICE Candidate
   * @returns
   */
  public candidate = async (
    ice: RTCIceCandidate & {
      id: Identifier
    }
  ) => {
    const conn = this.connections.get(ice.id)
    if (!conn) return
    const candidate = new RTCIceCandidate(ice)
    conn.pc.addIceCandidate(candidate)
  }

  /**
   * 相手が退室したときの処理
   *
   * @param id 相手のID
   */
  public leave = (id: Identifier) => {
    this.connections.get(id)?.close()
    this.connections.delete(id)
  }

  /**
   * メッセージを送信する
   *
   * @param id 送信相手のID
   * @param message メッセージ
   * @returns
   */
  public sendTo = (id: Identifier, message: string) => {
    if (this.connections.get(id)?.dc?.readyState !== 'open') return
    this.connections.get(id)?.dc?.send(message)
  }

  /**
   * 全員にメッセージを送信する
   *
   * @param message メッセージ
   */
  public broadcast = (message: string) => {
    this.connections.forEach((connection) => {
      if (connection.dc?.readyState !== 'open') return
      connection.dc?.send(message)
    })
  }

  /**
   * メッセージが届いた時のイベントリスナーを登録する
   *
   * @param callback コールバック
   * @returns
   */
  public onMessage = (callback: (message: string) => void): (() => void) => {
    return customEventListener(
      CustomEventType.ON_DATA_CHANNEL_MESSAGE,
      callback
    )
  }

  /**
   * 全ての接続を閉じる
   */
  public close = () => {
    this.connections.forEach((connection) => {
      connection.close()
    })
    this.connections.clear()
    this.state = CONNECTION_STATE.CLOSED
    this._me = ''
    this._host = ''
  }

  /**
   * 接続を作成する
   *
   * @param id 相手のID
   * @param onIceCandidate ICE Candidate取得時のコールバック
   * @returns
   */
  private getConnection = (
    id: Identifier,
    onIceCandidate: (evt: RTCPeerConnectionIceEvent) => void
  ) => {
    const cached = this.connections.get(id)
    if (cached) return cached

    const connection = new WebRTCConnection({ ...this.options, onIceCandidate })
    this.connections.set(id, connection)
    return connection
  }

  set state(state: keyof typeof CONNECTION_STATE) {
    this._state = state
  }
  set host(hostId: Identifier) {
    this._host = hostId
  }
  set me(me) {
    this._me = me
  }
  get state() {
    return this._state
  }
  get host() {
    return this._host
  }
  get me() {
    return this._me
  }
  get isHost() {
    return this._me === this._host
  }
}
