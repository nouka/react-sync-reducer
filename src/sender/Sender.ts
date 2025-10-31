import { WebRTCConnection } from '../connection/Connection'
import { Identifier } from '../types'

export interface Sender {
  broadcast(message: string): void
  sendTo(id: Identifier, message: string): void
  set connections(connections: Map<Identifier, WebRTCConnection>)
}
export class WebRTCSender implements Sender {
  private peers: Map<Identifier, WebRTCConnection> = new Map()
  public broadcast = (message: string): void => {
    this.peers.forEach((peer) => {
      if (peer.dc?.readyState !== 'open') return
      peer.dc?.send(message)
    })
  }
  public sendTo = (id: Identifier, message: string): void => {
    if (this.peers.get(id)?.dc?.readyState !== 'open') return
    this.peers.get(id)?.dc?.send(message)
  }
  set connections(peers: Map<Identifier, WebRTCConnection>) {
    this.peers = peers
  }
}
