import { useState } from 'react'
import { SyncStateProvider } from 'react-sync-reducer'
import { AppProvider } from './contexts/AppProvider'
import { useApp } from './contexts/app-hooks'
import { Daytime } from './routes/Daytime'
import { Intro } from './routes/Intro'
import { Midnight } from './routes/Midnight'
import { Result } from './routes/Result'
import { Page } from './types/state'

export const Root = () => {
  const [isHost, setIsHost] = useState<boolean | null>(null)
  if (isHost === null) {
    return (
      <>
        <button onClick={() => setIsHost(true)}>Join at Host</button>
        <button onClick={() => setIsHost(false)}>Join at Guest</button>
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

const App = () => {
  const { state } = useApp()
  switch (state.page) {
    case Page.INTRO:
      return <Intro />
    case Page.DAYTIME:
      return <Daytime />
    case Page.MIDNIGHT:
      return <Midnight />
    case Page.RESULT:
      return <Result />
    default:
      throw new Error('not found')
  }
}

export default App
