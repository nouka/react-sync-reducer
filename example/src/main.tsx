import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Root } from './App.tsx'
import ErrorBoundary from './errors/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<>Error</>}>
      <Suspense fallback={<>Loading...</>}>
        <Root />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
)
