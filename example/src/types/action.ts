import type { ActionBase } from 'react-sync-reducer'
import type { Identifier, Role, TimerStatus } from './state'

/**
 * アクションタイプ
 */
export const ActionType = {
  ENTRY: 'example/ENTRY',
  EXIT: 'example/EXIT',
  START: 'example/START',
  TO_NIGHT: 'example/TO_NIGHT',
  TO_DAYTIME: 'example/TO_DAYTIME',
  TO_RESULT: 'example/TO_RESULT',
  TIMER_START: 'example/TIMER_START',
  TIMER_COUNTDOWN: 'example/TIMER_COUNTDOWN',
  TIMER_FINISHED: 'example/TIMER_FINISHED',
  VOTE: 'example/VOTE',
  VOTE_FINISHED: 'example/VOTE_FINISHED',
  PUBLIC_MESSAGE: 'example/PUBLIC_MESSAGE',
  PRIVATE_MESSAGE: 'example/PRIVATE_MESSAGE'
} as const

/**
 * アクション
 */
export type EntryAction = ActionBase<
  typeof ActionType.ENTRY,
  { id: Identifier; name: string; role: keyof typeof Role }
>
export type ExitAction = ActionBase<typeof ActionType.EXIT, { id: Identifier }>
export type StartAction = ActionBase<typeof ActionType.START>
export type ToNightAction = ActionBase<typeof ActionType.TO_NIGHT>
export type ToDaytimeAction = ActionBase<typeof ActionType.TO_DAYTIME>
export type ToResultAction = ActionBase<typeof ActionType.TO_RESULT>
export type TimerStartAction = ActionBase<
  typeof ActionType.TIMER_START,
  { limit: number }
>
export type TimerCountdownAction = ActionBase<
  typeof ActionType.TIMER_COUNTDOWN,
  { current: number }
>
export type TimerFinishedAction = ActionBase<typeof ActionType.TIMER_FINISHED>
export type VoteAction = ActionBase<
  typeof ActionType.VOTE,
  { from: Identifier; to: Identifier }
>
export type VoteFinishedAction = ActionBase<typeof ActionType.VOTE_FINISHED>
export type PublicMessageAction = ActionBase<
  typeof ActionType.PUBLIC_MESSAGE,
  {
    id: Identifier
    message: string
  }
>
export type PrivateMessageAction = ActionBase<
  typeof ActionType.PRIVATE_MESSAGE,
  {
    id: Identifier
    message: string
  }
>

export type Action =
  | EntryAction
  | ExitAction
  | StartAction
  | ToNightAction
  | ToDaytimeAction
  | ToResultAction
  | TimerStartAction
  | TimerCountdownAction
  | TimerFinishedAction
  | VoteAction
  | VoteFinishedAction
  | PublicMessageAction
  | PrivateMessageAction
