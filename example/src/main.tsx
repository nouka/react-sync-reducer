import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './errors/ErrorBoundary.tsx'
/**
 * メモ
 * WebRTCを処理するアダプターを用意
 * どんなインターフェースが必要か
 *
 * isReady ... 通信できる状態になったかどうかで、アプリ自体をマウントできる必要がある
 * isHost ... どちらがホストか。これは通信形態に関わらず、今回のアーキテクチャでは必要。
 * sender, handler ... プロバイダの命名を修正した方がいい。
 *
 * WebSocketが使用できるなら、よりシンプル。
 * WebRTCは接続確立までにSDPのやりとりが発生するため、ちょっと複雑になる。
 * P2PManagerクラスはそのまま必要になりそう。
 *
 * イメージ
 *
 * interface Adapter {
 *   constructor(config) {}
 *   connect(): () => void
 *   state: 'not ready' | 'ready' ...
 *   sender: (message: string) => void // メッセージを送信できるSenderをAdapterが返す
 *   handler: (handler) => () => void // メッセージを受け取って処理するハンドラと登録解除のメソッド
 * }
 *
 * useEffect(() => {
 *   const removeListener = addEventListener(adapter.connect)
 *   return () => removeListener()
 * }, [])
 *
 * if (adapter.state !== 'ready') return
 *
 * クライアント側のイメージ
 *
 * <SyncStateProvider
 *   adapter={new WebRTCAdapter(config) | new WebSocketAdapter(config) | new CustomAdapter(config)}
 * />
 *   <App />
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<>Error</>}>
      <Suspense fallback={<>Loading...</>}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
)
