import { EventEmitter, EventHandler } from '../types'

export interface Adapter {
  connect(): Promise<{
    emit: EventEmitter
    on: EventHandler
  }>
  disconnect(): void
}
