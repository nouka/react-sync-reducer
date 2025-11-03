import stringify from 'fast-safe-stringify'
import React from 'react'
import { SyncStateContext } from '../contexts/SyncStateProvider'
import { ActionBase, ActionType, State } from '../types'
import { handleAction, isDeliveAction, isRequestAction } from '../utils'

/**
 * 共有ステートを Reducer でハンドリングできるフック
 *
 * @param reducer Reducer
 * @param initState 初期ステート
 * @returns
 */
export const useSyncReducer = <T extends State, A extends ActionBase<any, any>>(
  reducer: React.Reducer<T, A>,
  initState?: T
) => {
  const { connection } = React.useContext(SyncStateContext)

  /**
   * Reducer
   */
  const [state, dispatch] = React.useReducer(
    handleAction(reducer),
    initState ?? ({} as T)
  )

  /**
   * 状態データのリビジョン番号、比較に用います
   */
  const revision = React.useRef<number>(0)

  /**
   * データチャンネルのハンドラ登録
   */
  React.useEffect(() => {
    const handler = connection.isHost ? hostHandler : clientHandler
    const unsubscribe = connection.receiver.onMessage(handler)
    return () => unsubscribe()
  }, [connection.isHost, connection.receiver])

  /**
   * 状態データ変更時の処理
   * State のリビジョン番号を Ref に保存し、比較に利用します。
   * ホストの場合は DELIVE イベントを発行し、他のユーザーに State を配布します。
   */
  React.useEffect(() => {
    console.debug('sync state:', state)
    revision.current = state.revision ?? 0
    connection.isHost &&
      connection.sender.broadcast(
        stringify({
          type: ActionType.DELIVE,
          payload: state
        })
      )
  }, [state])

  /**
   * アクションのディスパッチャ
   * ホストは単に自分自身の State を変更します。
   * クライアントはデータチャンネル経由でアクションをリクエストします。
   *
   * @param action アクション
   */
  const dispatchAction = (action: A) => {
    connection.isHost
      ? dispatch(action)
      : connection.host &&
        connection.sender.sendTo(
          connection.host,
          stringify({
            type: ActionType.REQUEST,
            payload: action
          })
        )
  }

  /**
   * データチャンネルのメッセージハンドラ
   * ホストがクライアントから REQUEST アクションを受け取った場合は、dispatch を実行し State を更新します。
   *
   * @param message メッセージ
   *
   * @returns
   */
  const hostHandler = async (message: string) => {
    const action = JSON.parse(message)

    // REQUEST
    if (isRequestAction(action)) {
      dispatch(action.payload as A)
      return
    }
  }

  /**
   * データチャンネルのメッセージハンドラ
   * クライアントがホストから DELIVE アクションを受け取った場合は、ハッシュ値を比較し差異があれば自分の State を更新します。
   *
   * @param message メッセージ
   *
   * @returns
   */
  const clientHandler = async (message: string) => {
    const action = JSON.parse(message)

    // DELIVE
    if (isDeliveAction<{ revision: number | undefined }>(action)) {
      // リビジョン番号を比較
      if (revision.current >= (action.payload?.revision ?? 0)) return
      dispatch(action as A)
      return
    }
  }

  return {
    state,
    dispatch: dispatchAction
  }
}
