import { io, Socket } from 'socket.io-client'
import { Identifier } from '../types'

export const EVENTS = {
  RECEIVE_CONNECTED: 'RECEIVE_CONNECTED',
  LEAVE_USER: 'LEAVE_USER',
  RECEIVE_CALL: 'RECEIVE_CALL',
  RECEIVE_SDP: 'RECEIVE_SDP',
  RECEIVE_CANDIDATE: 'RECEIVE_CANDIDATE',
  STARTED_GAME: 'STARTED_GAME'
} as const

export const EMIT_EVENTS = {
  SEND_ENTER: 'SEND_ENTER',
  SEND_EXIT: 'SEND_EXIT',
  SEND_CANDIDATE: 'SEND_CANDIDATE',
  SEND_SDP: 'SEND_SDP',
  START_GAME: 'START_GAME'
} as const

export type EventHandlers = Set<
  | {
      type: typeof EVENTS.RECEIVE_CONNECTED
      handler: (
        socket: Socket,
        resolve: (
          value:
            | { socket: Socket; id: Identifier }
            | PromiseLike<{ socket: Socket; id: Identifier }>
        ) => void,
        data: { id: Identifier }
      ) => void
    }
  | {
      type: typeof EVENTS.LEAVE_USER
      handler: (data: { id: Identifier }) => void
    }
  | {
      type: typeof EVENTS.RECEIVE_CALL
      handler: (socket: Socket, data: { id: Identifier }) => void
    }
  | {
      type: typeof EVENTS.RECEIVE_SDP
      handler: (
        socket: Socket,
        sdp: RTCSessionDescription & {
          id: Identifier
        }
      ) => void
    }
  | {
      type: typeof EVENTS.RECEIVE_CANDIDATE
      handler: (
        ice: RTCIceCandidate & {
          id: Identifier
        }
      ) => void
    }
  | {
      type: typeof EVENTS.STARTED_GAME
      handler: (id: Identifier) => void
    }
>

export interface SocketBuilderOptions {
  serverUrl: string
}
export default class SocketBuilder {
  private static defaultOptions: SocketBuilderOptions = {
    serverUrl: `localhost:9030`
  }
  private static handlers: EventHandlers = new Set()

  private constructor() {}

  public static registerHandlers = (handlers: EventHandlers) => {
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
          if (type === EVENTS.RECEIVE_CONNECTED) {
            return handler(socket, resolve, data)
          }
          if (
            type === EVENTS.LEAVE_USER ||
            type === EVENTS.RECEIVE_CANDIDATE ||
            type === EVENTS.STARTED_GAME
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
