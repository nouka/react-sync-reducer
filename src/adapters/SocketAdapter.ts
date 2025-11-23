import { EventEmitter, EventHandler } from '../types'
import { Adapter } from './Adapter'

export class SocketAdapter implements Adapter {
  private _connect: () => Promise<{
    emit: EventEmitter
    on: EventHandler
  }>
  private _disconnect: () => void

  constructor(
    connect: () => Promise<{
      emit: EventEmitter
      on: EventHandler
    }>,
    disconnect: () => void
  ) {
    this._connect = connect
    this._disconnect = disconnect
  }

  public connect = async () => {
    return this._connect()
  }

  public disconnect = () => {
    return this._disconnect()
  }
}
