import { useSyncReducer } from '@nouka/react-sync-reducer'
import { createContext } from 'react'
import type { Action } from '../types/action'
import { type State } from '../types/state'

export const AppContext = createContext(
  {} as ReturnType<typeof useSyncReducer<State, Action>> & {
    participant: Pick<State, 'participants'>['participants'][number] | undefined
  }
)
