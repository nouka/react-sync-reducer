export const ConnectionState = {
  CLOSED: 'CLOSED',
  CONNECTED: 'CONNECTED',
  PENDING: 'PENDING'
} as const

export type ConnectionState =
  (typeof ConnectionState)[keyof typeof ConnectionState]
