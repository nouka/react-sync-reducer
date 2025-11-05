import type { Reducer } from 'react'
import { initState, Page, TimerStatus, type State } from '../types/state'
import { ActionType, type Action } from '../types/action'

export const reducer: Reducer<State, Action> = (state, action) => {
  const modifiedState = CommonReducer(state, action)
  switch (state.page) {
    case Page.INTRO:
      return IntroReducer(modifiedState, action)
    case Page.DAYTIME:
      return DaytimeReducer(modifiedState, action)
    case Page.MIDNIGHT:
      return MidnightReducer(modifiedState, action)
    case Page.RESULT:
      return ResultReducer(modifiedState, action)
    default:
      throw new Error('invalid page')
  }
}

const CommonReducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case ActionType.ENTRY: {
      const { id, name, role } = action.payload
      return {
        ...state,
        participants: [...state.participants, { id, name, role }]
      }
    }
    case ActionType.EXIT: {
      const { id } = action.payload
      return {
        ...state,
        participants: [
          ...state.participants.filter((participant) => participant.id !== id)
        ]
      }
    }
    default:
      return state
  }
}

const IntroReducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case ActionType.START: {
      return { ...state, page: Page.DAYTIME }
    }
    default:
      return state
  }
}

const DaytimeReducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case ActionType.TO_NIGHT: {
      return { ...state, page: Page.MIDNIGHT, timer: initState.timer }
    }
    case ActionType.TIMER_START: {
      const { limit } = action.payload
      return {
        ...state,
        timer: { ...state.timer, status: TimerStatus.STARTED, limit }
      }
    }
    case ActionType.TIMER_COUNTDOWN: {
      const { current } = action.payload
      return {
        ...state,
        timer: { ...state.timer, current }
      }
    }
    case ActionType.TIMER_FINISHED: {
      return {
        ...state,
        timer: { ...state.timer, status: TimerStatus.FINISHED }
      }
    }
    default:
      return state
  }
}

const MidnightReducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case ActionType.TO_DAYTIME: {
      return { ...state, page: Page.DAYTIME, timer: initState.timer }
    }
    case ActionType.TO_RESULT: {
      return { ...state, page: Page.RESULT, timer: initState.timer }
    }
    case ActionType.TIMER_START: {
      const { limit } = action.payload
      return {
        ...state,
        timer: { ...state.timer, status: TimerStatus.STARTED, limit }
      }
    }
    case ActionType.TIMER_COUNTDOWN: {
      const { current } = action.payload
      return {
        ...state,
        timer: { ...state.timer, current }
      }
    }
    case ActionType.TIMER_FINISHED: {
      return {
        ...state,
        timer: { ...state.timer, status: TimerStatus.FINISHED }
      }
    }
    default:
      return state
  }
}

const ResultReducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    default:
      return state
  }
}
