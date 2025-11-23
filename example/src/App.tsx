import { SyncStateProvider } from '@nouka/react-sync-reducer'
import { io } from 'socket.io-client'
import { AppProvider } from './contexts/AppProvider'
import { useApp } from './contexts/app-hooks'
import { Daytime } from './routes/Daytime'
import { Intro } from './routes/Intro'
import { Midnight } from './routes/Midnight'
import { Result } from './routes/Result'
import { Page } from './types/state'

export const App = () => {
  const socket = io('localhost:9030')
  return (
    <SyncStateProvider
      options={{
        connect: async () => ({
          emit: (...args) => void socket.emit(...args),
          on: (...args) => void socket.on(...args)
        }),
        disconnect: () => socket.close()
      }}
    >
      <AppProvider>
        <Route />
      </AppProvider>
    </SyncStateProvider>
  )
}

const Route = () => {
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
