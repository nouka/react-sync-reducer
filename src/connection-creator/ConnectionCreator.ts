import { WebRTCOptions } from '../connection/WebRTCConnection'
import { Connections } from '../connections/Connections'
import { Identifier } from '../types'

export interface ConnectionCreator {
  create(options: WebRTCOptions & { roomName: string }): Promise<Connections>
  readonly host: Identifier
  readonly me: Identifier
  readonly isHost: boolean
}
