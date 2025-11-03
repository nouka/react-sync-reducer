import type { ActionBase } from 'react-sync-reducer'

/**
 * アクションタイプ
 */
export const ActionType = {
  ENTRY: 'example/ENTRY',
  EXIT: 'example/EXIT'
} as const

/**
 * アクション
 */
export type EntryAction = ActionBase<
  typeof ActionType.ENTRY,
  {
    someActionParameter: string
  }
>
export type ExitAction = ActionBase<typeof ActionType.EXIT>

export type Action = EntryAction | ExitAction
