import { WebRTCConnection } from '../connection/WebRTCConnection'
import { Identifier } from '../types'
import { Sender } from './Sender'

export class WebRTCSender implements Sender {
  private webRtcConnections: Map<Identifier, WebRTCConnection> = new Map()
  public broadcast = (message: string): void => {
    this.webRtcConnections.forEach((connection) => {
      if (connection.dc?.readyState !== 'open') return
      connection.dc?.send(message)
    })
  }
  public sendTo = (id: Identifier, message: string): void => {
    if (this.webRtcConnections.get(id)?.dc?.readyState !== 'open') return
    this.webRtcConnections.get(id)?.dc?.send(message)
  }
  set connections(connections: Map<Identifier, WebRTCConnection>) {
    this.webRtcConnections = connections
  }
}
