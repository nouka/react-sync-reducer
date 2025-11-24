import cors from 'cors'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

const CLIENT_PORT = 5173
const SERVER_PORT = 9030

/**
 * Socket.ioの準備
 */
const app = express()
app.use(cors())
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: `http://localhost:${CLIENT_PORT}`,
    credentials: true
  }
})

/**
 * サーバの起動
 */
server.listen(SERVER_PORT, () => {
  console.log(`server running at http://localhost:${SERVER_PORT}`)
})

/**
 * ソケット通信のハンドラ
 */
io.on('connection', (socket) => {
  console.log('a user connected')

  /**
   * 接続完了
   */
  socket.emit('CONNECTED', { id: socket.id })

  /**
   * 切断
   */
  socket.on('disconnect', () => {
    console.log('id=' + socket.id + ' exit room:' + socket.roomName)
    socket.broadcast.to(socket.roomName).emit('DISCONNECTED', { id: socket.id })
    socket.leave(socket.roomName)
  })

  /**
   * 入室
   */
  socket.on('ENTER', function ({ roomName }) {
    socket.isHost = socket.adapter.rooms.get(roomName) ? false : true
    socket.join(roomName)
    console.log(
      'id=' +
        socket.id +
        ' enter room:' +
        roomName +
        ' isHost: ' +
        socket.isHost
    )
    socket.roomName = roomName
    socket.broadcast.to(socket.roomName).emit('JOINED', { id: socket.id })
  })

  /**
   * SDPの交換
   */
  socket.on('SDP', function (data) {
    data.sdp.id = socket.id
    const { sdp } = data
    if (data.target) {
      socket.to(data.target).emit('SDP', { sdp })
    }
  })

  /**
   * ICE CANDIDATEの交換
   */
  socket.on('CANDIDATE', function (data) {
    if (data.target) {
      data.ice.id = socket.id
      const { ice } = data
      socket.to(data.target).emit('CANDIDATE', { ice })
    } else {
      console.log('candidate need target id')
    }
  })

  /**
   * 完了
   */
  socket.on('COMPLETE', function (data) {
    socket.emit('COMPLETED', { id: socket.id, isHost: socket.isHost })
    socket
      .to(data.target)
      .emit('COMPLETED', { id: socket.id, isHost: socket.isHost })
  })
})
