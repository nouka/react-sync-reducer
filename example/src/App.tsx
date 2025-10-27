import { SyncStateProvider, useSyncState } from 'react-sync-reducer'
import { reducer } from './reducers'
import { ActionType } from './types/action'

function App() {
  return (
    <SyncStateProvider initState={{}} reducer={reducer}>
      <Content />
    </SyncStateProvider>
  )
}

const Content = () => {
  const { state, dispatchAction } = useSyncState()

  return (
    <>
      <p>{state.sharedString}</p>
      <button
        onClick={() =>
          dispatchAction({
            type: ActionType.ENTRY,
            payload: {
              someActionParameter: 'someAction'
            }
          })
        }
      >
        entryActionButton
      </button>
      <button
        onClick={() =>
          dispatchAction({
            type: ActionType.EXIT,
            payload: undefined
          })
        }
      >
        exitActionButton
      </button>
    </>
  )
}

export default App
