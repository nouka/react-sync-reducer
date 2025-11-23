export interface Connection {
  readonly pc: RTCPeerConnection
  readonly dc: RTCDataChannel | undefined
  close(): void
}
