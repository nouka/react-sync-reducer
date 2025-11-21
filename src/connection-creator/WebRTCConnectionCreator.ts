import { SocketAdapter } from '../adapters/SocketAdapter'
import { WebRTCOptions } from '../connection/WebRTCConnection'
import { WebRTCConnections } from '../connections/WebRTCConnections'
import { RECEIVE_EVENTS, SEND_EVENTS } from '../constants'
import { Identifier } from '../types'
import { ConnectionCreator } from './ConnectionCreator'

export class WebRTCConnectionCreator implements ConnectionCreator {
  private adapter: SocketAdapter
  private myId: Identifier = ''
  private hostId: Identifier = ''

  constructor(adapter: SocketAdapter) {
    this.adapter = adapter
  }

  public create = async (
    options: Omit<WebRTCOptions, 'onIceCandidate'> & {
      roomName: string
    }
  ) => {
    const { emit, on } = await this.adapter.connect()
    return new Promise<WebRTCConnections>((resolve) => {
      const { roomName, ...rest } = options
      const connections = new WebRTCConnections(rest)
      on(RECEIVE_EVENTS.CONNECTED, async ({ id }) => {
        this.myId = id
        emit(SEND_EVENTS.ENTER, { roomName })
      })
      on(RECEIVE_EVENTS.DISCONNECTED, async ({ id }) => {
        connections.leave(id)
      })
      on(RECEIVE_EVENTS.YOU_HOST, async () => {
        this.hostId = this.myId
      })
      on(RECEIVE_EVENTS.JOINED, async ({ id }) => {
        const peerConnection = await connections.join(id, (evt) => {
          emit(SEND_EVENTS.CANDIDATE, {
            target: id,
            ice: evt.candidate
          })
        })
        if (!peerConnection) return
        emit(SEND_EVENTS.SDP, {
          target: id,
          sdp: peerConnection.localDescription
        })
      })
      on(RECEIVE_EVENTS.SDP, async ({ sdp }) => {
        switch (sdp.type) {
          case 'offer': {
            const peerConnection = await connections.offer(sdp, (evt) => {
              emit(SEND_EVENTS.CANDIDATE, {
                target: sdp.id,
                ice: evt.candidate
              })
            })
            if (!peerConnection) return
            emit(SEND_EVENTS.SDP, {
              target: sdp.id,
              sdp: peerConnection.localDescription
            })
            break
          }
          case 'answer': {
            await connections.answer(sdp)
            emit(SEND_EVENTS.COMPLETE, null)
            resolve(connections)
            break
          }
        }
      })
      on(RECEIVE_EVENTS.CANDIDATE, async ({ ice }) => {
        await connections.candidate(ice)
      })
      on(RECEIVE_EVENTS.COMPLETED, async ({ hostId }) => {
        this.hostId = hostId || ''
        resolve(connections)
      })
    })
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
