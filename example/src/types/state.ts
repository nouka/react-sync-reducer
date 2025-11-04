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

export type State = {
  page: keyof typeof Page
  participants: {
    id: Identifier
    name: string
    role: keyof typeof Role
  }[]
  timer: {
    current: number
    limit: number
  }
  votes: {
    id: Identifier
  }[]
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
    current: 0,
    limit: 0
  },
  votes: [],
  publicMessages: [],
  privateMessages: []
}
