import type { Reducer } from 'react'
import type { State } from '../types/state'
import { ActionType, type Action } from '../types/action'

export const reducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case ActionType.ENTRY:
      return { ...state, sharedString: action.payload.someActionParameter }
    case ActionType.EXIT:
      return { ...state, sharedString: '' }
    default:
      return state
  }
}
