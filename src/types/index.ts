import { Reducer } from 'react'
import { P2PManager } from '../adapters/P2PManager'

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
  isHost?: boolean
  reducer: Reducer<any, ActionBase<any, any>>
  p2pManager: P2PManager
}

export enum CustomEventType {
  ON_DATA_CHANNEL_MESSAGE = 'ON_DATA_CHANNEL_MESSAGE'
}
