import { CustomEventType } from '../types'
import { customEventListener } from '../utils'

export interface Receiver {
  onMessage(callback: (message: string) => void): () => void
}
export class WebRTCReceiver implements Receiver {
  constructor() {}
  public onMessage = (callback: (message: string) => void): (() => void) => {
    return customEventListener(
      CustomEventType.ON_DATA_CHANNEL_MESSAGE,
      callback
    )
  }
}
