# React Sync Reducer

WebRTCのデータチャンネルを介してStateを共有できるuseReducer関数を提供します。

## インストール方法

```
npm install @nouka/react-sync-reducer
```

### 設定方法（例：Socket.IO）

最初にプロバイダを作成し、シグナリングサーバ（Socket.IOなど）と通信するための関数を渡す必要があります。
以下はSocket.IOを使用する場合の例です。

#### React

```tsx
createRoot(document.getElementById('root')!).render(<App />);

// シグナリングサーバと通信するための関数を設定するSyncStateProviderを提供します。
// useSyncReducerフックは、このプロバイダが提供するContext内でのみ使用できます。
const App = () => {
  // Socket.IOサーバとの接続
  const socket = io('localhost:9030');
  return (
    <SyncStateProvider
      options={{
        connect: async () => ({
          // イベントエミッターの登録
          emit: (...args) => void socket.emit(...args),
          // イベントハンドラの登録
          on: (...args) => void socket.on(...args)
        }),
        // 接続終了のための関数を登録
        disconnect: () => socket.close()
      }}
    >
      <Main />
    </SyncStateProvider>
  )
};

// Reducerの例
const reducer = (state, action) => {
  switch (action.type) {
    case 'post':
      const { message } = action.payload;
      return { ...state, messages: [...state.messages, message] };
    default:
      return state;
  }
};

// Stateの例
const initState = {
  messages: []
};

// 簡単なテキストチャットの例
const Main = () => {
  const { state, dispatch, me, host, isHost } = useSyncReducer(reducer, initState)
  const [message, setMessage] = useState<string>()
  return (
    <div>
      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={() => {
        dispatch({
          type: 'post',
          payload: { message }
        })
      }}>
        送信
      </button>
      {state.messages.map((message) => {
        return <p>{message}</p>
      })}
    </div>
  )
};
```

#### シグナリングサーバ

サーバ側には定型的な実装が必要となります。
以下を参考に設定ください。

```js
import cors from 'cors'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

const CLIENT_PORT = 5173
const SERVER_PORT = 9030

/**
 * Socket.ioの準備
 */
const app = express()
app.use(cors())
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: `http://localhost:${CLIENT_PORT}`,
    credentials: true
  }
})

/**
 * サーバの起動
 */
server.listen(SERVER_PORT, () => {
  console.log(`server running at http://localhost:${SERVER_PORT}`)
})

/**
 * ソケット通信のハンドラ
 */
io.on('connection', (socket) => {

  /**
   * 接続完了
   * 接続したユーザを特定するユニークなIDを返す必要があります。
   */
  socket.emit('CONNECTED', { id: socket.id })

  /**
   * 切断
   * 切断したユーザのIDをルーム全員に通知します。
   */
  socket.on('disconnect', () => {
    socket.broadcast.to(socket.roomName).emit('DISCONNECTED', { id: socket.id })
    socket.leave(socket.roomName)
  })

  /**
   * 入室
   * 指定したルームに入室しホストを特定します。
   * ホストが誰かは最終的にルーム全員に通知することになります。
   */
  socket.on('ENTER', function ({ roomName }) {
    socket.isHost = socket.adapter.rooms.get(roomName) ? false : true
    socket.join(roomName)
    socket.roomName = roomName
    socket.broadcast.to(socket.roomName).emit('JOINED', { id: socket.id })
  })

  /**
   * SDPの交換
   * SDPはofferとanswerを送り合いますので、送信ユーザのIDを返します。
   */
  socket.on('SDP', function (data) {
    data.sdp.id = socket.id
    const { sdp } = data
    if (data.target) {
      socket.to(data.target).emit('SDP', { sdp })
    }
  })

  /**
   * ICE CANDIDATEの交換
   * ICE Candidateも双方で送り合うため、送信ユーザのIDを返します。
   */
  socket.on('CANDIDATE', function (data) {
    if (data.target) {
      data.ice.id = socket.id
      const { ice } = data
      socket.to(data.target).emit('CANDIDATE', { ice })
    }
  })

  /**
   * 完了
   * 完了通知は自分を含めたルーム内の全員に送信します。
   * その際ホストが誰かわかるように、isHostフラグを返す必要があります。
   */
  socket.on('COMPLETE', function (data) {
    socket.emit('COMPLETED', { id: socket.id, isHost: socket.isHost })
    socket
      .to(data.target)
      .emit('COMPLETED', { id: socket.id, isHost: socket.isHost })
  })
})
```

詳細は以下サンプルを参照ください。

- [サンプル：人狼ゲーム](example)
