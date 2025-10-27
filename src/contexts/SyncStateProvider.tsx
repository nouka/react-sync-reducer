import stringify from 'fast-safe-stringify'
import * as React from 'react'
import { P2PManager } from '../adapters/P2PManager'
import SocketBuilder from '../adapters/SocketBuilder'
import {
  ActionBase,
  ActionType,
  CustomEventType,
  ISyncStateContext,
  State,
  SyncStateProps
} from '../types'
import {
  customEventListener,
  handleAction,
  isDeliveAction,
  isRequestAction
} from '../utils/'

/**
 * State を複数名で同期するためのコンテキスト
 *
 * state ............ 状態データ
 * dispatchAction ... アクションのディスパッチャ
 * forceDispatch .... アクションの強制ディスパッチャ
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
 * isHost ....................... ホスト
 * reducer ...................... 状態データをハンドリングする関数、useReducer を使って state を書き換えます。
 * p2pManager ................... P2PManager のインスタンス
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
  const socketBuilder = React.useMemo(() => SocketBuilder.build(), [])
  const p2pManager = React.useMemo(() => P2PManager.getInstance(), [])

  const [isHost, setIsHost] = React.useState<boolean>(false)
  const [status, setStatus] = React.useState<string>('closed')
  const [isGamePlaying, setIsGamePlaying] = React.useState<boolean>(false)

  const bootstrap = React.useCallback(async () => {
    // ソケット通信を初期化しユーザーIDを表示
    if (isBooted.current) return
    isBooted.current = true

    const { socket, id } = await socketBuilder
    console.log('connected to signaling server. my id=', id)

    // 自動的にJOIN
    socket.emit('SEND_ENTER', roomName)

    // 切断などで退室ユーザーを確認した場合
    socket.on('LEAVE_USER', (data) => {
      console.log('LEAVE_USER', data)
      p2pManager.closePeerConnection(data.id)
    })

    // Join Roomを受け付けてオファーを作成し送り返す
    socket.on('RECEIVE_CALL', async (data) => {
      console.log('RECEIVE_CALL', data)
      const peerConnection = await p2pManager.makeOfferToPeer(
        data.id,
        (evt) => {
          socket.emit('SEND_CANDIDATE', { target: data.id, ice: evt.candidate })
        }
      )
      if (!peerConnection) return
      socket.emit('SEND_SDP', {
        target: data.id,
        sdp: peerConnection.localDescription
      })
      setStatus('offer created')
    })

    // SDPの受け付け
    // オファーの場合はアンサーを作成して送り返す
    // アンサーの場合はremoteDescriptionにセットして終了
    socket.on('RECEIVE_SDP', async (sdp) => {
      console.log('RECEIVE_SDP', sdp)
      switch (sdp.type) {
        case 'offer': {
          const peerConnection = await p2pManager.receiveOfferFromPeer(
            sdp,
            (evt) => {
              socket.emit('SEND_CANDIDATE', {
                target: sdp.id,
                ice: evt.candidate
              })
            }
          )
          if (!peerConnection) return
          socket.emit('SEND_SDP', {
            target: sdp.id,
            sdp: peerConnection.localDescription
          })
          setStatus('create answer')
          break
        }
        case 'answer':
          await p2pManager.receiveAnswerFromPeer(sdp)
          if (!isGamePlaying) {
            setIsHost(true)
            setIsGamePlaying(true)
          }
          socket.emit('START_GAME')

          setStatus('start game')
          break
        default:
          console.log('unkown sdp...')
          break
      }
    })

    // ICE CANDIDATEの受け付け
    socket.on('RECEIVE_CANDIDATE', (ice) => {
      console.log('RECEIVE_CANDIDATE', ice)
      p2pManager.receiveCandidateFromPeer(ice)
    })

    // ホストのゲーム開始を受けて、クライアントがゲームを起動する処理
    socket.on('STARTED_GAME', async () => {
      if (isGamePlaying) return
      setIsHost(false)
      setIsGamePlaying(true)
    })

    return () => {
      socket.emit('SEND_EXIT')
      setIsGamePlaying(false)
      setStatus('closed')
      isBooted.current = false
    }
  }, [socketBuilder, p2pManager, isGamePlaying])

  React.useEffect(() => {
    ;(async () => {
      const unsubscribe = await bootstrap()
      return () => unsubscribe && unsubscribe()
    })()
  }, [bootstrap])

  if (!isGamePlaying) return <p>{status}</p>

  return (
    <InnerSyncStateProvider
      initState={initState}
      isHost={isHost}
      reducer={reducer}
      p2pManager={p2pManager}
    >
      {children}
    </InnerSyncStateProvider>
  )
}

type Props = {
  initState?: State
  isHost?: boolean
  reducer: React.Reducer<any, ActionBase<any, any>>
  p2pManager: P2PManager
}

const InnerSyncStateProvider: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  initState = {},
  isHost = false,
  reducer,
  p2pManager
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
    const handler = isHost ? hostHandler : clientHandler
    const unsubscribe = customEventListener(
      CustomEventType.ON_DATA_CHANNEL_MESSAGE,
      handler
    )
    return () => unsubscribe()
  }, [isHost])

  /**
   * 状態データ変更時の処理
   * State のリビジョン番号を Ref に保存し、比較に利用します。
   * ホストの場合は DELIVE イベントを発行し、他のユーザーに State を配布します。
   */
  React.useEffect(() => {
    console.debug('sync state:', state)
    revision.current = state.revision ?? 0
    isHost &&
      p2pManager.broadcastDataChannel(
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
    isHost
      ? dispatch(action)
      : p2pManager.broadcastDataChannel(
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
