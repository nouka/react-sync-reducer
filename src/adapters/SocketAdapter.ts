import { Adapter, Initialize } from './Adapter'

export class SocketAdapter implements Adapter {
  private init: Initialize

  constructor(initialize: Initialize) {
    this.init = initialize
  }

  public connect = async () => {
    return this.init()
  }
}
