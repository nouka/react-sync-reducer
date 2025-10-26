import { io, Socket } from 'socket.io-client'

const SERVER_PORT = 9030
const RECEIVE_CONNECTED = 'RECEIVE_CONNECTED'

export default class SocketBuilder {
  private constructor() {}

  public static async build() {
    return new Promise<{ socket: Socket; id: string }>((resolve) => {
      const socket = io(`localhost:${SERVER_PORT}`)
      socket.on(RECEIVE_CONNECTED, (data) => {
        console.log(RECEIVE_CONNECTED, data)
        resolve({ socket, id: data.id })
      })
    })
  }
}
