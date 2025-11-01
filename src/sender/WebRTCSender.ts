import { WebRTCConnection } from '../connection/WebRTCConnection'
import { Identifier } from '../types'
import { Sender } from './Sender'

/**
 * WebRTCによるピア接続の送信を管理するクラス
 */
export class WebRTCSender implements Sender {
  /**
   * ピア接続のマップ
   */
  private conns: Map<Identifier, WebRTCConnection> = new Map()

  /**
   * 全ピア接続にメッセージを送信する
   *
   * @param message メッセージ
   */
  public broadcast = (message: string): void => {
    this.conns.forEach((connection) => {
      if (connection.dc?.readyState !== 'open') return
      connection.dc?.send(message)
    })
  }

  /**
   * 特定のピア接続にメッセージを送信する
   *
   * @param id 接続先のID
   * @param message メッセージ
   * @returns
   */
  public sendTo = (id: Identifier, message: string): void => {
    if (this.conns.get(id)?.dc?.readyState !== 'open') return
    this.conns.get(id)?.dc?.send(message)
  }

  set connections(connections: Map<Identifier, WebRTCConnection>) {
    this.conns = connections
  }
}
