import { EventEmitter, EventHandler } from '../types'

export type Initialize = () => Promise<{
  emit: EventEmitter
  on: EventHandler
}>

export interface Adapter {
  connect(): ReturnType<Initialize>
  close(): void
}
