import { Reducer } from 'react'
import { Socket } from 'socket.io-client'
import { ConnectionManagerConfig } from '../connection-manager/ConnectionManager'
import { RECEIVE_EVENTS } from '../constants'

export type Identifier = string | number

export type ActionBase<T, P> = {
  type: T
  payload: P
}

export type Handler<T> = (value: T) => void

export enum ActionType {
  DELIVE = 'react-sync-state/DELIVE',
  REQUEST = 'react-sync-state/REQUEST'
}

export type DeliveAction<T> = ActionBase<ActionType.DELIVE, T>
export type RequestAction<T> = ActionBase<ActionType.REQUEST, T>

export type State = { [key: string]: any } & { revision?: number }

export interface ISyncStateContext {
  state: State
  dispatchAction: (action: ActionBase<any, any>) => void
}

export type SyncStateProps = {
  initState?: State
  roomName?: string
  config?: Partial<ConnectionManagerConfig>
  reducer: Reducer<any, ActionBase<any, any>>
}

export enum CustomEventType {
  ON_DATA_CHANNEL_MESSAGE = 'ON_DATA_CHANNEL_MESSAGE'
}

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
      type: typeof RECEIVE_EVENTS.CALL
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
