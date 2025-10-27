import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CustomEventType,
  P2PManager,
  SyncStateProvider,
  useSyncState,
  type Handler
} from 'react-sync-reducer'
import { reducer } from './reducers'
import SocketBuilder from './SocketBuilder'
import { ActionType } from './types/action'
import { customEventListener } from './utils'

const DEFAULT_ROOM_NAME = 'test_room'

function App() {
  const [isHost, setIsHost] = useState<boolean>(false)
  const [status, setStatus] = useState<string>('closed')
  const [isGamePlaying, setIsGamePlaying] = useState<boolean>(false)

  const isBooted = useRef<boolean>(false)
  const socketBuilder = useMemo(() => SocketBuilder.build(), [])
  const p2pManager = useMemo(() => P2PManager.getInstance(), [])

  const bootstrap = useCallback(async () => {
    // ソケット通信を初期化しユーザーIDを表示
    if (isBooted.current) return
    isBooted.current = true

    const { socket, id } = await socketBuilder
    console.log('connected to signaling server. my id=', id)

    // 自動的にJOIN
    socket.emit('SEND_ENTER', DEFAULT_ROOM_NAME)

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

  useEffect(() => {
    ;(async () => {
      const unsubscribe = await bootstrap()
      return () => unsubscribe && unsubscribe()
    })()
  }, [bootstrap])

  if (!isGamePlaying) return <p>{status}</p>

  return (
    <SyncStateProvider
      initState={{}}
      isHost={isHost}
      reducer={reducer}
      send={p2pManager.broadcastDataChannel}
      registerHandler={(handler: Handler<string>) =>
        customEventListener(CustomEventType.ON_DATA_CHANNEL_MESSAGE, handler)
      }
    >
      <Content />
    </SyncStateProvider>
  )
}

const Content = () => {
  const { state, dispatchAction } = useSyncState()

  return (
    <>
      <p>{state.sharedString}</p>
      <button
        onClick={() =>
          dispatchAction({
            type: ActionType.ENTRY,
            payload: {
              someActionParameter: 'someAction'
            }
          })
        }
      >
        entryActionButton
      </button>
      <button
        onClick={() =>
          dispatchAction({
            type: ActionType.EXIT,
            payload: undefined
          })
        }
      >
        exitActionButton
      </button>
    </>
  )
}

export default App
