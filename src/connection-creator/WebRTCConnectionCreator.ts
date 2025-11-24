import { SocketAdapter } from '../adapters/SocketAdapter'
import { WebRTCConnections } from '../connections/WebRTCConnections'
import { CONNECTION_STATE, RECEIVE_EVENTS, SEND_EVENTS } from '../constants'
import { WebRTCOptions } from '../types'
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
    return new Promise<WebRTCConnections>((resolve, reject) => {
      const { roomName, ...rest } = options
      const connections = new WebRTCConnections(rest)
      on(RECEIVE_EVENTS.CONNECTED, async ({ id }) => {
        connections.me = id
        emit(SEND_EVENTS.ENTER, { roomName })
      })
      on(RECEIVE_EVENTS.DISCONNECTED, async ({ id }) => {
        if (connections.host === id) {
          connections.close()
          this.adapter.disconnect()
          return
        }
        connections.leave(id)
      })
      on(RECEIVE_EVENTS.JOINED, async ({ id }) => {
        try {
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
        } catch (err) {
          reject(err)
        }
      })
      on(RECEIVE_EVENTS.SDP, async ({ sdp }) => {
        switch (sdp.type) {
          case 'offer': {
            try {
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
            } catch (err) {
              reject(err)
            }
            break
          }
          case 'answer': {
            try {
              await connections.answer(sdp)
              emit(SEND_EVENTS.COMPLETE, { target: sdp.id })
            } catch (err) {
              reject(err)
            }
            break
          }
        }
      })
      on(RECEIVE_EVENTS.CANDIDATE, async ({ ice }) => {
        try {
          await connections.candidate(ice)
        } catch (err) {
          reject(err)
        }
      })
      on(RECEIVE_EVENTS.COMPLETED, async ({ id, isHost }) => {
        // Hostの接続が完了するまで待つ
        if (isHost) {
          connections.host = id
          connections.state = CONNECTION_STATE.CONNECTED
          resolve(connections)
        }
      })
    })
  }
}
