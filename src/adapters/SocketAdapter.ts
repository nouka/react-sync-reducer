import { EventEmitter, EventHandler } from '../types'

export class SocketAdapter {
  private _connect: () => Promise<{
    emit: EventEmitter
    on: EventHandler
  }>
  private _disconnect: () => void

  constructor(
    connect: typeof this._connect,
    disconnect: typeof this._disconnect
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
