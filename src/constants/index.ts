import { ConnectionManagerOptions } from '../connection-manager/ConnectionManager'

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
  JOINED: 'JOINED',
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

export const DEFAULT_OPTIONS: ConnectionManagerOptions = {
  roomName: 'default-room',
  socketBuilderOptions: {
    serverUrl: `localhost:9030`
  },
  connectionOptions: {
    onIceCandidate: (_evt: RTCPeerConnectionIceEvent): void => {
      void _evt
    },
    peerConnectionOptions: {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    },
    dataChannelLabel: 'default-data-channel',
    dataChannelOptions: {
      ordered: true
    }
  }
}
