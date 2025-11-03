import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { SyncStateProvider } from 'react-sync-reducer'
import App from './App.tsx'
import ErrorBoundary from './errors/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<>Error</>}>
      <Suspense fallback={<>Loading...</>}>
        <SyncStateProvider>
          <App />
        </SyncStateProvider>
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
)
