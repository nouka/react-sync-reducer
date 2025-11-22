import { Adapter, Initialize } from './Adapter'

export class SocketAdapter implements Adapter {
  private init: Initialize
  private destroy: () => void

  constructor(initialize: Initialize, destroy: () => void) {
    this.init = initialize
    this.destroy = destroy
  }

  public connect = async () => {
    return this.init()
  }

  public close = () => {
    return this.destroy()
  }
}
