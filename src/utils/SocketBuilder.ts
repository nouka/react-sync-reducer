import { io, Socket } from 'socket.io-client'
import { RECEIVE_EVENTS } from '../constants'
import { Identifier, ReceiveEventHandlers } from '../types'

export interface SocketBuilderOptions {
  serverUrl: string
}

export default class SocketBuilder {
  private static defaultOptions: SocketBuilderOptions = {
    serverUrl: `localhost:9030`
  }
  private static handlers: ReceiveEventHandlers = new Set()

  private constructor() {}

  public static registerHandlers = (handlers: ReceiveEventHandlers) => {
    this.handlers = handlers
    return this
  }

  public static async build(
    options: Partial<SocketBuilderOptions> | undefined
  ) {
    const { serverUrl } = this.margeDefaultOptions(options)
    return new Promise<{ socket: Socket; id: Identifier }>((resolve) => {
      const socket = io(serverUrl)
      this.handlers.forEach(({ type, handler }) => {
        socket.on(type, (data) => {
          if (type === RECEIVE_EVENTS.CONNECTED) {
            return handler(socket, resolve, data)
          }
          if (
            type === RECEIVE_EVENTS.DISCONNECTED ||
            type === RECEIVE_EVENTS.CANDIDATE ||
            type === RECEIVE_EVENTS.COMPLETED
          ) {
            return handler(data)
          }
          return handler(socket, data)
        })
      })
    })
  }

  private static margeDefaultOptions = (
    options: Partial<SocketBuilderOptions> | undefined
  ): SocketBuilderOptions => {
    return {
      ...this.defaultOptions,
      ...options
    }
  }
}
