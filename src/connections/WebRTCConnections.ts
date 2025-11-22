import { WebRTCConnection, WebRTCOptions } from '../connection/WebRTCConnection'
import { CustomEventType, Identifier } from '../types'
import { customEventListener } from '../utils'
import { Connections } from './Connections'

type Options = Omit<WebRTCOptions, 'onIceCandidate'>

export class WebRTCConnections implements Connections {
  private connections: Map<Identifier, WebRTCConnection> = new Map()
  private options: Options
  private myId: Identifier = ''
  private hostId: Identifier = ''

  constructor(options: Options) {
    this.options = options
  }

  public join = async (
    id: Identifier,
    onIceCandidate: (evt: RTCPeerConnectionIceEvent) => void
  ) => {
    const conn = this.getConnection(id, onIceCandidate)
    return await conn.makeOfferToPeer()
  }

  public offer = async (
    sdp: RTCSessionDescription & {
      id: Identifier
    },
    onIceCandidate: (evt: RTCPeerConnectionIceEvent) => void
  ) => {
    const conn = this.getConnection(sdp.id, onIceCandidate)
    return await conn.receiveOfferFromPeer(sdp)
  }

  public answer = async (
    sdp: RTCSessionDescription & {
      id: Identifier
    }
  ) => {
    const conn = this.connections.get(sdp.id)
    if (!conn) return
    await conn.receiveAnswerFromPeer(sdp)
  }

  public candidate = async (
    ice: RTCIceCandidate & {
      id: Identifier
    }
  ) => {
    const conn = this.connections.get(ice.id)
    if (!conn) return
    await conn.receiveCandidateFromPeer(ice)
  }

  public leave = (id: Identifier) => {
    this.connections.get(id)?.close()
    this.connections.delete(id)
  }

  public sendTo = (id: Identifier, message: string) => {
    if (this.connections.get(id)?.dc?.readyState !== 'open') return
    this.connections.get(id)?.dc?.send(message)
  }

  public broadcast = (message: string) => {
    this.connections.forEach((connection) => {
      if (connection.dc?.readyState !== 'open') return
      connection.dc?.send(message)
    })
  }

  public onMessage = (callback: (message: string) => void): (() => void) => {
    return customEventListener(
      CustomEventType.ON_DATA_CHANNEL_MESSAGE,
      callback
    )
  }

  public close = () => {
    this.connections.forEach((connection) => {
      connection.close()
    })
    this.connections.clear()
  }

  private getConnection = (
    id: Identifier,
    onIceCandidate: (evt: RTCPeerConnectionIceEvent) => void
  ) => {
    const cached = this.connections.get(id)
    if (cached) return cached

    const connection = new WebRTCConnection({ ...this.options, onIceCandidate })
    this.connections.set(id, connection)
    return connection
  }

  set host(hostId: Identifier) {
    this.hostId = hostId
  }
  set me(myId) {
    this.myId = myId
  }
  get host() {
    return this.hostId
  }
  get me() {
    return this.myId
  }
  get isHost() {
    return this.myId === this.hostId
  }
}
