import express from 'express'
import cors from 'cors'
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
   * 接続完了イベント
   */
  socket.emit('CONNECTED', { id: socket.id })

  /**
   * 切断イベントの登録
   */
  socket.on('disconnect', () => {
    console.log('id=' + socket.id + ' exit room:' + socket.roomname)
    socket.broadcast.to(socket.roomname).emit('DISCONNECTED', { id: socket.id })
  })

  /**
   * 入室イベント
   */
  socket.on('ENTER', function (roomname) {
    socket.join(roomname)
    console.log('id=' + socket.id + ' enter room:' + roomname)
    socket.roomname = roomname
    socket.broadcast.to(socket.roomname).emit('JOINED', { id: socket.id })
  })

  /**
   * 退室イベント
   */
  socket.on('EXIT', function () {
    socket.leave(socket.roomname)
    socket.broadcast.to(socket.roomname).emit('LEAVE_USER', { id: socket.id })
  })

  /**
   * SDPの交換
   */
  socket.on('SDP', function (data) {
    data.sdp.id = socket.id
    if (data.target) {
      socket.to(data.target).emit('SDP', data.sdp)
    } else {
      socket.broadcast.to(socket.roomname).emit('SDP', data.sdp)
    }
  })

  /**
   * ICE CANDIDATEの交換
   */
  socket.on('CANDIDATE', function (data) {
    if (data.target) {
      data.ice.id = socket.id
      socket.to(data.target).emit('CANDIDATE', data.ice)
    } else {
      console.log('candidate need target id')
    }
  })

  /**
   * GAMEの実行
   */
  socket.on('COMPLETE', function () {
    socket.broadcast.to(socket.roomname).emit('COMPLETED', socket.id)
  })
})
