import { Initialize } from '../adapters/Adapter'
import { WebRTCOptions } from '../connection/WebRTCConnection'
import { Connections } from '../connections/Connections'

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

export type State = { [key: string]: unknown } & { revision?: number }

export interface ISyncStateContext {
  connections: Connections
  host: Identifier
  me: Identifier
  isHost: boolean
}

export type SyncStateProps = {
  options: {
    roomName?: string
    initialize: Initialize
  } & Partial<Omit<WebRTCOptions, 'onIceCandidate'>>
}

export const CustomEventType = {
  ON_DATA_CHANNEL_MESSAGE: 'ON_DATA_CHANNEL_MESSAGE'
} as const
