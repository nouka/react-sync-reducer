import type { ActionBase } from 'react-sync-reducer'

/**
 * アクションタイプ
 */
export enum ActionType {
  ENTRY = 'example/ENTRY',
  EXIT = 'example/EXIT'
}

/**
 * アクション
 */
export type EntryAction = ActionBase<
  ActionType.ENTRY,
  {
    someActionParameter: string
  }
>
export type ExitAction = ActionBase<ActionType.EXIT, undefined>

export type Action = EntryAction | ExitAction
