import { createContext, useContext, type PropsWithChildren } from 'react'
import { useSyncReducer } from 'react-sync-reducer'
import { reducer } from '../reducers'
import { initState, type State } from '../types/state'
import type { Action } from '../types/action'

const AppContext = createContext(
  {} as ReturnType<typeof useSyncReducer<State, Action>>
)

export const AppProvider = ({ children }: PropsWithChildren) => {
  const response = useSyncReducer(reducer, initState)
  return <AppContext.Provider value={response}>{children}</AppContext.Provider>
}

export const useApp = () => {
  return useContext(AppContext)
}
