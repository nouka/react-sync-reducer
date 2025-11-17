import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import 'tailwindcss'
import App from './App.tsx'
import ErrorBoundary from './errors/ErrorBoundary.tsx'
import './main.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<>Error</>}>
      <Suspense fallback={<>Loading...</>}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
)
