import { Reducer } from 'react'
import {
  ActionBase,
  ActionType,
  CustomEventType,
  DeliveAction,
  Handler,
  RequestAction,
  State
} from '../types'

/**
 * DELIVE アクションの判定
 *
 * @param action アクション
 *
 * @returns boolean
 */
export const isDeliveAction = <S extends {}>(
  action: ActionBase<any, any>
): action is DeliveAction<S> => {
  return action.type === ActionType.DELIVE
}

/**
 * REQUEST アクションの判定
 *
 * @param action アクション
 *
 * @returns boolean
 */
export const isRequestAction = <A extends ActionBase<any, any>>(
  action: ActionBase<any, any>
): action is RequestAction<A> => {
  return action.type === ActionType.REQUEST
}

/**
 * アクションのハンドリング
 * Reducer を受け取って Reducer を返す高階関数になっています。
 * 任意の Reducer に対して、このライブラリで特別に処理したいアクションをコントロールするために、
 * ラッピングしています。
 *
 * @param reducer 任意の Reducer
 *
 * @returns Reducer
 */
export const handleAction =
  <S extends State, A extends ActionBase<any, any>>(
    reducer: Reducer<S, A>
  ): Reducer<S, A> =>
  (state: S, action: A): S => {
    // DELIVEの場合はそのままStateを返す（クライアント専用）
    if (isDeliveAction(action)) {
      return { ...action.payload }
    }
    // Reducerの実行
    const nextState = reducer(state, action)
    // 次のリビジョン番号を作成
    const nextRevision = state.revision !== undefined ? state.revision + 1 : 1
    return {
      ...nextState,
      revision: nextRevision
    }
  }

/**
 * カスタムイベントをリッスンするハンドラの登録/登録解除を行う
 *
 * @param type カスタムイベントのタイプ
 * @param handler イベントハンドラ
 *
 * @returns 登録解除関数
 */
export const customEventListener = <T>(
  type: CustomEventType,
  handler: Handler<T>
) => {
  const listener = (e: Event) => handler((e as CustomEvent).detail)
  window.addEventListener(type, listener, false)
  return () => window.removeEventListener(type, listener, false)
}
