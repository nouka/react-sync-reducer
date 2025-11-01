export const ConnectionState = {
  CLOSED: 'CLOSED',
  CONNECTED: 'CONNECTED',
  PENDING: 'PENDING'
} as const

export type ConnectionState =
  (typeof ConnectionState)[keyof typeof ConnectionState]

export const RECEIVE_EVENTS = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  CALL: 'CALL',
  SDP: 'SDP',
  CANDIDATE: 'CANDIDATE',
  COMPLETED: 'COMPLETED'
} as const

export const SEND_EVENTS = {
  ENTER: 'ENTER',
  EXIT: 'EXIT',
  CANDIDATE: 'CANDIDATE',
  SDP: 'SDP',
  COMPLETE: 'COMPLETE'
} as const
