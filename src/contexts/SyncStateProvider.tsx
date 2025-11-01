import stringify from 'fast-safe-stringify'
import * as React from 'react'
import { ConnectionManager } from '../connection-manager/ConnectionManager'
import { ConnectionState } from '../constants'
import {
  ActionBase,
  ActionType,
  ISyncStateContext,
  State,
  SyncStateProps
} from '../types'
import { handleAction, isDeliveAction, isRequestAction } from '../utils/'

/**
 * State を複数名で同期するためのコンテキスト
 *
 * state ............ 状態データ
 * dispatchAction ... アクションのディスパッチャ
 */
const SyncStateContext = React.createContext<ISyncStateContext>({
  state: {},
  dispatchAction: (_action: ActionBase<any, any>) => {
    throw new Error('Function not implemented.')
  }
})

/**
 * 状態データをデータチャンネル経由で同期するためのプロバイダ
 * ホスト/クライアント型のパターンで P2P 通信で同期します。
 *
 * roomName ......... ルーム名、同じ名前のルームに参加したユーザー同士で状態データを同期します。
 * initState ........ 初期状態データ
 * reducer .......... 状態データをハンドリングする関数、useReducer を使って state を書き換えます。
 *
 * @returns
 */
const DEFAULT_ROOM_NAME = 'test_room'

const SyncStateProvider: React.FC<React.PropsWithChildren<SyncStateProps>> = ({
  children,
  roomName = DEFAULT_ROOM_NAME,
  initState = {},
  reducer
}) => {
  const isBooted = React.useRef<boolean>(false)
  const connection = React.useMemo(() => new ConnectionManager(), [])

  const [isGamePlaying, setIsGamePlaying] = React.useState<boolean>(false)

  const bootstrap = React.useCallback(async () => {
    if (isBooted.current) return
    isBooted.current = true

    const connectionState = await connection.connect({ roomName })
    console.log('connectionState=', connectionState)
    if (connectionState === ConnectionState.CONNECTED) {
      setIsGamePlaying(true)
    }

    return () => {
      connection.close()
      setIsGamePlaying(false)
      isBooted.current = false
    }
  }, [roomName])

  React.useEffect(() => {
    ;(async () => {
      const unsubscribe = await bootstrap()
      return () => unsubscribe && unsubscribe()
    })()
  }, [bootstrap])

  if (!isGamePlaying) return null

  return (
    <InnerSyncStateProvider
      initState={initState}
      reducer={reducer}
      connection={connection}
    >
      {children}
    </InnerSyncStateProvider>
  )
}

type Props = {
  initState?: State
  reducer: React.Reducer<any, ActionBase<any, any>>
  connection: ConnectionManager
}

const InnerSyncStateProvider: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  initState = {},
  reducer,
  connection
}) => {
  /**
   * Reducer
   */
  const [state, dispatch] = React.useReducer(handleAction(reducer), initState)

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
  const dispatchAction = (action: ActionBase<any, any>) => {
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
      dispatch(action.payload)
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
      dispatch(action)
      return
    }
  }

  return (
    <SyncStateContext.Provider
      value={{
        state,
        dispatchAction
      }}
    >
      {children}
    </SyncStateContext.Provider>
  )
}

export const useSyncState = () => {
  const { state, dispatchAction } = React.useContext(SyncStateContext)
  return {
    state,
    dispatchAction
  }
}

export default SyncStateProvider
