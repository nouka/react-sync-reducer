/**
 * 状態データの型
 */
export type Identifier = string | number

export const Page = {
  INTRO: 'INTRO',
  DAYTIME: 'DAYTIME',
  MIDNIGHT: 'MIDNIGHT',
  RESULT: 'RESULT'
} as const

export const Role = {
  VILLAGER: 'VILLAGER',
  WEREWOLF: 'WEREWOLF',
  FORTUNE_TELLER: 'FORTUNE_TELLER'
} as const

export const TimerStatus = {
  INITIALIZED: 'INITIALIZED',
  STARTED: 'STARTED',
  FINISHED: 'FINISHED'
} as const

export const VoteStatus = {
  INITIALIZED: 'INITIALIZED',
  STARTED: 'STARTED',
  FINISHED: 'FINISHED'
} as const

export type State = {
  page: keyof typeof Page
  participants: {
    id: Identifier
    name: string
    role: keyof typeof Role
    living: boolean
  }[]
  timer: {
    status: keyof typeof TimerStatus
    current: number
    limit: number
  }
  votes: {
    status: keyof typeof VoteStatus
    vote: { [from: Identifier]: Identifier }
  }
  publicMessages: {
    id: Identifier
    message: string
  }[]
  privateMessages: {
    id: Identifier
    message: string
  }[]
}

export const initState: State = {
  page: Page.INTRO,
  participants: [],
  timer: {
    status: TimerStatus.INITIALIZED,
    current: 0,
    limit: 0
  },
  votes: {
    status: VoteStatus.INITIALIZED,
    vote: {}
  },
  publicMessages: [],
  privateMessages: []
}
