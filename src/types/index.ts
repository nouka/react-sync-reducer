import { Reducer } from 'react'

export type Identifier = string | number
export type Peers = Map<
  Identifier,
  { pc?: RTCPeerConnection; dc?: RTCDataChannel }
>

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
  reducer: Reducer<any, ActionBase<any, any>>
}

export enum CustomEventType {
  ON_DATA_CHANNEL_MESSAGE = 'ON_DATA_CHANNEL_MESSAGE'
}
