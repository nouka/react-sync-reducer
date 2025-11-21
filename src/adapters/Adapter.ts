import { RECEIVE_EVENTS, SEND_EVENTS } from '../constants'
import { Identifier } from '../types'

type Emitter = {
  (event: typeof SEND_EVENTS.ENTER, data: { roomName: string }): void
  (event: typeof SEND_EVENTS.EXIT, data: null): void
  (
    event: typeof SEND_EVENTS.CANDIDATE,
    data: { target: Identifier; ice: RTCIceCandidate | null }
  ): void
  (
    event: typeof SEND_EVENTS.SDP,
    data: {
      target: Identifier
      sdp: RTCSessionDescription | null
    }
  ): void
  (event: typeof SEND_EVENTS.COMPLETE, data: null): void
}

type Handler = {
  (
    event: typeof RECEIVE_EVENTS.CONNECTED,
    callback: (data: { id: Identifier }) => Promise<void>
  ): void
  (
    event: typeof RECEIVE_EVENTS.DISCONNECTED,
    callback: (data: { id: Identifier }) => Promise<void>
  ): void
  (event: typeof RECEIVE_EVENTS.YOU_HOST, callback: () => Promise<void>): void
  (
    event: typeof RECEIVE_EVENTS.JOINED,
    callback: (data: { id: Identifier }) => Promise<void>
  ): void
  (
    event: typeof RECEIVE_EVENTS.SDP,
    callback: (data: {
      sdp: RTCSessionDescription & {
        id: Identifier
      }
    }) => Promise<void>
  ): void
  (
    event: typeof RECEIVE_EVENTS.CANDIDATE,
    callback: (data: {
      ice: RTCIceCandidate & {
        id: Identifier
      }
    }) => Promise<void>
  ): void
  (
    event: typeof RECEIVE_EVENTS.COMPLETED,
    callback: (data: { hostId?: Identifier }) => Promise<void>
  ): void
}

export type Initialize = () => Promise<{
  emit: Emitter
  on: Handler
}>

export interface Adapter {
  connect(): ReturnType<Initialize>
}
