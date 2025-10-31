import { Connection } from '../connection/Connection'
import { Identifier } from '../types'

export interface Sender {
  broadcast(message: string): void
  sendTo(id: Identifier, message: string): void
  set connections(connections: Map<Identifier, Connection>)
}
