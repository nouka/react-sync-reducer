import { CONNECTION_STATE } from '../constants'
import { Identifier } from '../types'

export interface Connections {
  state: keyof typeof CONNECTION_STATE
  host: Identifier
  me: Identifier
  readonly isHost: boolean
  sendTo(id: Identifier, message: string): void
  broadcast(message: string): void
  onMessage(callback: (message: string) => void): () => void
  close(): void
}
