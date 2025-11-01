import { CustomEventType } from '../types'
import { customEventListener } from '../utils'
import { Receiver } from './Receiver'

/**
 * WebRTCによるピア接続の受信を管理するクラス
 */
export class WebRTCReceiver implements Receiver {
  /**
   * メッセージ受信のイベントリスナーを登録する
   *
   * @param callback メッセージ受信時のコールバック
   * @returns
   */
  public onMessage = (callback: (message: string) => void): (() => void) => {
    return customEventListener(
      CustomEventType.ON_DATA_CHANNEL_MESSAGE,
      callback
    )
  }
}
