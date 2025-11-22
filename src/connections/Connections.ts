import { Identifier } from '../types'

export interface Connections {
  host: Identifier
  me: Identifier
  readonly isHost: boolean
  sendTo(id: Identifier, message: string): void
  broadcast(message: string): void
  onMessage(callback: (message: string) => void): () => void
  close(): void
}
