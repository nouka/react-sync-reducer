import { StrictMode, Suspense, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { SyncStateProvider } from 'react-sync-reducer'
import App from './App.tsx'
import ErrorBoundary from './errors/ErrorBoundary.tsx'
import { AppProvider } from './contexts/AppContext.tsx'

const Root = () => {
  const [isHost, setIsHsot] = useState<boolean | null>(null)
  if (isHost === null) {
    return (
      <>
        <button onClick={() => setIsHsot(true)}>Join at Host</button>
        <button onClick={() => setIsHsot(false)}>Join at Guest</button>
      </>
    )
  }
  return (
    <SyncStateProvider options={{ isHost }}>
      <AppProvider>
        <App />
      </AppProvider>
    </SyncStateProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<>Error</>}>
      <Suspense fallback={<>Loading...</>}>
        <Root />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
)
