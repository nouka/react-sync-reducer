import { io, Socket } from 'socket.io-client'
import { RECEIVE_EVENTS } from '../constants'
import { Identifier, ReceiveEventHandlers } from '../types'

export interface SocketBuilderOptions {
  serverUrl: string
}

/**
 * ソケット通信のビルダー
 */
export default class SocketBuilder {
  /**
   * ソケット通信のハンドラ
   */
  private static handlers: ReceiveEventHandlers = new Set()

  /**
   * ハンドラの登録処理
   *
   * @param handlers ハンドラ
   * @returns
   */
  public static registerHandlers = (handlers: ReceiveEventHandlers) => {
    this.handlers = handlers
    return this
  }

  /**
   * ソケット通信の開始処理
   *
   * @param options オプション
   * @returns
   */
  public static async build(options: SocketBuilderOptions) {
    const { serverUrl } = options
    return new Promise<{ socket: Socket; id: Identifier }>((resolve) => {
      const socket = io(serverUrl)
      this.handlers.forEach(({ type, handler }) => {
        socket.on(type, (data) => {
          if (type === RECEIVE_EVENTS.CONNECTED) {
            return handler(socket, resolve, data)
          }
          if (type === RECEIVE_EVENTS.YOU_HOST) {
            return handler()
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
}
