import type { Reducer } from 'react'
import {
  initState,
  Page,
  Role,
  TimerStatus,
  VoteStatus,
  type State
} from '../types/state'
import { ActionType, type Action } from '../types/action'

export const reducer: Reducer<State, Action> = (state, action) => {
  const mutatedState = CommonReducer(state, action)
  switch (state.page) {
    case Page.INTRO:
      return IntroReducer(mutatedState, action)
    case Page.DAYTIME:
      return DaytimeReducer(mutatedState, action)
    case Page.MIDNIGHT:
      return MidnightReducer(mutatedState, action)
    case Page.RESULT:
      return ResultReducer(mutatedState, action)
    default:
      throw new Error('invalid page')
  }
}

const CommonReducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case ActionType.ENTRY: {
      const { id, name } = action.payload
      return {
        ...state,
        participants: [
          ...state.participants,
          { id, name, role: Role.VILLAGER, living: true }
        ]
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
      const { participants } = state
      const nextParticipants = participants.map((participant) => {
        const payload = action.payload.find(
          (payload) => payload.id === participant.id
        )
        if (!payload) return participant
        const { role } = payload
        return { ...participant, role }
      })
      return { ...state, page: Page.DAYTIME, participants: nextParticipants }
    }
    default:
      return state
  }
}

const DaytimeReducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case ActionType.TO_NIGHT: {
      const { target } = action.payload
      const nextParticipants = state.participants.map((participant) => {
        if (participant.id === target) {
          return { ...participant, living: false }
        }
        return { ...participant }
      })
      return {
        ...state,
        page: Page.MIDNIGHT,
        timer: initState.timer,
        votes: initState.votes,
        participants: nextParticipants
      }
    }
    case ActionType.TO_RESULT: {
      return {
        ...state,
        page: Page.RESULT,
        timer: initState.timer,
        votes: initState.votes
      }
    }
    case ActionType.TIMER_START:
    case ActionType.TIMER_COUNTDOWN:
    case ActionType.TIMER_FINISHED:
      return TimerReducer(state, action)
    case ActionType.VOTE_START:
    case ActionType.VOTE:
    case ActionType.VOTE_FINISHED:
      return VoteReducer(state, action)
    case ActionType.PUBLIC_MESSAGE: {
      const { id, message } = action.payload
      return {
        ...state,
        publicMessages: [...state.publicMessages, { id, message }]
      }
    }
    default:
      return state
  }
}

const MidnightReducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case ActionType.TO_DAYTIME: {
      const { target } = action.payload
      const nextParticipants = state.participants.map((participant) => {
        if (participant.id === target) {
          return { ...participant, living: false }
        }
        return { ...participant }
      })
      return {
        ...state,
        page: Page.DAYTIME,
        timer: initState.timer,
        votes: initState.votes,
        participants: nextParticipants
      }
    }
    case ActionType.TO_RESULT: {
      return {
        ...state,
        page: Page.RESULT,
        timer: initState.timer,
        votes: initState.votes
      }
    }
    case ActionType.TIMER_START:
    case ActionType.TIMER_COUNTDOWN:
    case ActionType.TIMER_FINISHED:
      return TimerReducer(state, action)
    case ActionType.VOTE_START:
    case ActionType.VOTE:
    case ActionType.VOTE_FINISHED:
      return VoteReducer(state, action)
    case ActionType.PRIVATE_MESSAGE: {
      const { id, message } = action.payload
      return {
        ...state,
        privateMessages: [...state.privateMessages, { id, message }]
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

const TimerReducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case ActionType.TIMER_START: {
      const { limit } = action.payload
      return {
        ...state,
        timer: { ...initState.timer, status: TimerStatus.STARTED, limit }
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

const VoteReducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case ActionType.VOTE_START: {
      return {
        ...state,
        votes: { ...initState.votes, status: VoteStatus.STARTED }
      }
    }
    case ActionType.VOTE: {
      const { from, to } = action.payload
      return {
        ...state,
        votes: {
          vote: { ...state.votes.vote, [from]: to },
          status: state.votes.status
        }
      }
    }
    case ActionType.VOTE_FINISHED: {
      return {
        ...state,
        votes: { vote: { ...state.votes.vote }, status: VoteStatus.FINISHED }
      }
    }
    default:
      return state
  }
}
