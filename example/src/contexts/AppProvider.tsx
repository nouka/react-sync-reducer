import { useSyncReducer } from '@nouka/react-sync-reducer'
import { type PropsWithChildren } from 'react'
import { reducer } from '../reducers'
import { initState } from '../types/state'
import { AppContext } from './AppContext'

export const AppProvider = ({ children }: PropsWithChildren) => {
  const { state, dispatch, me, host, isHost } = useSyncReducer(
    reducer,
    initState
  )

  const participant = state.participants.find(
    (participant) => participant.id === me
  )

  return (
    <AppContext value={{ state, dispatch, me, host, isHost, participant }}>
      {children}
    </AppContext>
  )
}
