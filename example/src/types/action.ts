import type { ActionBase } from 'react-sync-reducer'
import type { Identifier, Role } from './state'

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
  TIMER_COUNTDOWN: 'example/TIMER_COUNTDOWN',
  DISCUSSION_START: 'example/DISCUSSION_START',
  VOTE_START: 'example/VOTE_START',
  VOTE: 'example/VOTE',
  PUBLIC_MESSAGE: 'example/PUBLIC_MESSAGE',
  PRIVATE_MESSAGE: 'example/PRIVATE_MESSAGE'
} as const

/**
 * アクション
 */
export type EntryAction = ActionBase<
  typeof ActionType.ENTRY,
  { id: Identifier; name: string }
>
export type ExitAction = ActionBase<typeof ActionType.EXIT, { id: Identifier }>
export type StartAction = ActionBase<
  typeof ActionType.START,
  { id: Identifier; role: keyof typeof Role }[]
>
export type ToNightAction = ActionBase<
  typeof ActionType.TO_NIGHT,
  {
    target: Identifier | undefined
  }
>
export type ToDaytimeAction = ActionBase<
  typeof ActionType.TO_DAYTIME,
  {
    target: Identifier | undefined
  }
>
export type ToResultAction = ActionBase<
  typeof ActionType.TO_RESULT,
  {
    target: Identifier | undefined
  }
>
export type TimerCountdownAction = ActionBase<
  typeof ActionType.TIMER_COUNTDOWN,
  { current: number }
>
export type DiscussionStartAction = ActionBase<
  typeof ActionType.DISCUSSION_START,
  {
    limit: number
  }
>
export type VoteStartAction = ActionBase<typeof ActionType.VOTE_START>
export type VoteAction = ActionBase<
  typeof ActionType.VOTE,
  { from: Identifier; to: Identifier }
>
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
  | TimerCountdownAction
  | DiscussionStartAction
  | VoteStartAction
  | VoteAction
  | PublicMessageAction
  | PrivateMessageAction
