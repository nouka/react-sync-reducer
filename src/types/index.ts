import { Initialize } from '../adapters/Adapter'
import { WebRTCOptions } from '../connection/WebRTCConnection'
import { Connections } from '../connections/Connections'
import { RECEIVE_EVENTS, SEND_EVENTS } from '../constants'

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
}

export type SyncStateProps = {
  options: {
    roomName?: string
    initialize: Initialize
    destroy: () => void
  } & Partial<Omit<WebRTCOptions, 'onIceCandidate'>>
}

export const CustomEventType = {
  ON_DATA_CHANNEL_MESSAGE: 'ON_DATA_CHANNEL_MESSAGE'
} as const

export type EventEmitter = {
  (event: typeof SEND_EVENTS.ENTER, data: { roomName: string }): void
  (
    event: typeof SEND_EVENTS.CANDIDATE,
    data: { target: Identifier; ice: RTCIceCandidate | null }
  ): void
  (
    event: typeof SEND_EVENTS.SDP,
    data: {
      target: Identifier
      sdp: RTCSessionDescription | null
    }
  ): void
  (event: typeof SEND_EVENTS.COMPLETE, data: { target: Identifier }): void
}

export type EventHandler = {
  (
    event: typeof RECEIVE_EVENTS.CONNECTED,
    callback: (data: { id: Identifier }) => Promise<void>
  ): void
  (
    event: typeof RECEIVE_EVENTS.DISCONNECTED,
    callback: (data: { id: Identifier }) => Promise<void>
  ): void
  (
    event: typeof RECEIVE_EVENTS.JOINED,
    callback: (data: { id: Identifier }) => Promise<void>
  ): void
  (
    event: typeof RECEIVE_EVENTS.SDP,
    callback: (data: {
      sdp: RTCSessionDescription & {
        id: Identifier
      }
    }) => Promise<void>
  ): void
  (
    event: typeof RECEIVE_EVENTS.CANDIDATE,
    callback: (data: {
      ice: RTCIceCandidate & {
        id: Identifier
      }
    }) => Promise<void>
  ): void
  (
    event: typeof RECEIVE_EVENTS.COMPLETED,
    callback: (data: { id: Identifier; isHost: boolean }) => Promise<void>
  ): void
}
