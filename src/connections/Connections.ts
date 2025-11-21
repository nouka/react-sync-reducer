import { Identifier } from '../types'

export interface Connections {
  join(
    id: Identifier,
    onIceCandidate: (evt: RTCPeerConnectionIceEvent) => void
  ): Promise<RTCPeerConnection | undefined>
  offer(
    sdp: RTCSessionDescription & {
      id: Identifier
    },
    onIceCandidate: (evt: RTCPeerConnectionIceEvent) => void
  ): Promise<RTCPeerConnection | undefined>
  answer(
    sdp: RTCSessionDescription & {
      id: Identifier
    }
  ): Promise<void>
  candidate(
    ice: RTCIceCandidate & {
      id: Identifier
    }
  ): Promise<void>
  leave(id: Identifier): void
  sendTo(id: Identifier, message: string): void
  broadcast(message: string): void
  onMessage(callback: (message: string) => void): () => void
  close(): void
}
