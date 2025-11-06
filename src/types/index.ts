import { Socket } from 'socket.io-client'
import {
  ConnectionManager,
  ConnectionManagerOptions
} from '../connection-manager/ConnectionManager'
import { RECEIVE_EVENTS } from '../constants'

export type Identifier = string | number

export type ActionBase<T, P = undefined> = P extends undefined
  ? {
      type: T
    }
  : {
      type: T
      payload: P
    }

export type Handler<T> = (value: T) => void

export const ActionType = {
  DELIVE: 'react-sync-state/DELIVE',
  REQUEST: 'react-sync-state/REQUEST'
} as const

export type DeliveAction<T> = ActionBase<typeof ActionType.DELIVE, T>
export type RequestAction<T> = ActionBase<typeof ActionType.REQUEST, T>

export type State = { [key: string]: any } & { revision?: number }

export interface ISyncStateContext {
  connection: ConnectionManager
}

export type SyncStateProps = {
  options?: Partial<ConnectionManagerOptions>
}

export const CustomEventType = {
  ON_DATA_CHANNEL_MESSAGE: 'ON_DATA_CHANNEL_MESSAGE'
} as const

export type ReceiveEventHandlers = Set<
  | {
      type: typeof RECEIVE_EVENTS.CONNECTED
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
      type: typeof RECEIVE_EVENTS.DISCONNECTED
      handler: (data: { id: Identifier }) => void
    }
  | {
      type: typeof RECEIVE_EVENTS.JOINED
      handler: (socket: Socket, data: { id: Identifier }) => void
    }
  | {
      type: typeof RECEIVE_EVENTS.SDP
      handler: (
        socket: Socket,
        sdp: RTCSessionDescription & {
          id: Identifier
        }
      ) => void
    }
  | {
      type: typeof RECEIVE_EVENTS.CANDIDATE
      handler: (
        ice: RTCIceCandidate & {
          id: Identifier
        }
      ) => void
    }
  | {
      type: typeof RECEIVE_EVENTS.COMPLETED
      handler: (id: Identifier) => void
    }
>
