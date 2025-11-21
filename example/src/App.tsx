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
  return (
    <SyncStateProvider
      options={{
        initialize: async () => {
          const socket = io('localhost:9030')
          return {
            emit: function (event, data) {
              void socket.emit(event, data)
            },
            on: function (event, callback) {
              void socket.on(event, callback)
            }
          }
        }
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
