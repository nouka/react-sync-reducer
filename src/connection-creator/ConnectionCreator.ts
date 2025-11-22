import { WebRTCOptions } from '../connection/WebRTCConnection'
import { Connections } from '../connections/Connections'

export interface ConnectionCreator {
  create(options: WebRTCOptions & { roomName: string }): Promise<Connections>
}
