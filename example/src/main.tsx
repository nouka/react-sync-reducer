import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './errors/ErrorBoundary.tsx'
/**
 * TODO: 全体的に、console.logを見直す
 * TODO: 全体的に、命名を見直す
 * TODO: シンプルなSocketサーバを介したP2P通信のサンプルを作成する
 * TODO: 英訳
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
