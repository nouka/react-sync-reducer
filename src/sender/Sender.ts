import { Identifier, Peers } from '../types'

export interface Sender {
  broadcast(message: string): void
  sendTo(id: Identifier, message: string): void
  set connections(peers: Peers)
}
export class WebRTCSender implements Sender {
  private peers: Peers = new Map()
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
  set connections(peers: Peers) {
    this.peers = peers
  }
}
