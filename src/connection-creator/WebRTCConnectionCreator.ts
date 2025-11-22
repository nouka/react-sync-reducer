import { SocketAdapter } from '../adapters/SocketAdapter'
import { WebRTCOptions } from '../connection/WebRTCConnection'
import { WebRTCConnections } from '../connections/WebRTCConnections'
import { RECEIVE_EVENTS, SEND_EVENTS } from '../constants'
import { ConnectionCreator } from './ConnectionCreator'

export class WebRTCConnectionCreator implements ConnectionCreator {
  private adapter: SocketAdapter

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
        connections.me = id
        emit(SEND_EVENTS.ENTER, { roomName })
      })
      on(RECEIVE_EVENTS.DISCONNECTED, async ({ id }) => {
        if (connections.host === id) {
          connections.close()
          return
        }
        connections.leave(id)
      })
      on(RECEIVE_EVENTS.YOU_HOST, async () => {
        connections.host = connections.me
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
        if (hostId) connections.host = hostId
        resolve(connections)
      })
    })
  }
}
