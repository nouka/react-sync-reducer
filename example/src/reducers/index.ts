import type { Reducer } from 'react'
import { ActionType, type Action } from '../types/action'
import { initState, Page, Role, VoteStatus, type State } from '../types/state'

export const reducer: Reducer<State, Action> = (state, action) => {
  console.log('reducer', state, action)
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
      const { target } = action.payload
      const nextParticipants = state.participants.map((participant) => {
        if (participant.id === target) {
          return { ...participant, living: false }
        }
        return { ...participant }
      })
      return {
        ...state,
        page: Page.RESULT,
        timer: initState.timer,
        votes: initState.votes,
        participants: nextParticipants
      }
    }
    case ActionType.TIMER_COUNTDOWN: {
      const { current } = action.payload
      return {
        ...state,
        timer: { ...state.timer, current }
      }
    }
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
        votes: { ...state.votes, vote: { ...state.votes.vote, [from]: to } }
      }
    }
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
      const { target } = action.payload
      const nextParticipants = state.participants.map((participant) => {
        if (participant.id === target) {
          return { ...participant, living: false }
        }
        return { ...participant }
      })
      return {
        ...state,
        page: Page.RESULT,
        timer: initState.timer,
        votes: initState.votes,
        participants: nextParticipants
      }
    }
    case ActionType.TIMER_COUNTDOWN: {
      const { current } = action.payload
      return {
        ...state,
        timer: { ...state.timer, current }
      }
    }
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
        votes: { ...state.votes, vote: { ...state.votes.vote, [from]: to } }
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
