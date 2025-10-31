import { CustomEventType } from '../types'
import { customEventListener } from '../utils'
import { Receiver } from './Receiver'

export class WebRTCReceiver implements Receiver {
  constructor() {}
  public onMessage = (callback: (message: string) => void): (() => void) => {
    return customEventListener(
      CustomEventType.ON_DATA_CHANNEL_MESSAGE,
      callback
    )
  }
}
