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
  socket.emit('RECEIVE_CONNECTED', { id: socket.id })

  /**
   * 切断イベントの登録
   */
  socket.on('disconnect', () => {
    console.log('id=' + socket.id + ' exit room:' + socket.roomname)
    socket.broadcast.to(socket.roomname).emit('LEAVE_USER', { id: socket.id })
  })

  /**
   * 接続完了イベント
   */
  socket.emit('RECEIVE_CONNECTED', { id: socket.id })

  /**
   * 切断イベントの登録
   */
  socket.on('disconnect', () => {
    console.log('id=' + socket.id + ' exit room:' + socket.roomname)
    socket.broadcast.to(socket.roomname).emit('LEAVE_USER', { id: socket.id })
  })

  /**
   * 入室イベント
   */
  socket.on('SEND_ENTER', function (roomname) {
    socket.join(roomname)
    console.log('id=' + socket.id + ' enter room:' + roomname)
    socket.roomname = roomname
    socket.broadcast.to(socket.roomname).emit('RECEIVE_CALL', { id: socket.id })
  })

  /**
   * 退室イベント
   */
  socket.on('SEND_EXIT', function () {
    socket.leave(socket.roomname)
    socket.broadcast.to(socket.roomname).emit('LEAVE_USER', { id: socket.id })
  })

  /**
   * SDPの交換
   */
  socket.on('SEND_SDP', function (data) {
    data.sdp.id = socket.id
    if (data.target) {
      socket.to(data.target).emit('RECEIVE_SDP', data.sdp)
    } else {
      socket.broadcast.to(socket.roomname).emit('RECEIVE_SDP', data.sdp)
    }
  })

  /**
   * ICE CANDIDATEの交換
   */
  socket.on('SEND_CANDIDATE', function (data) {
    if (data.target) {
      data.ice.id = socket.id
      socket.to(data.target).emit('RECEIVE_CANDIDATE', data.ice)
    } else {
      console.log('candidate need target id')
    }
  })

  /**
   * GAMEの実行
   */
  socket.on('START_GAME', function () {
    socket.broadcast.to(socket.roomname).emit('STARTED_GAME')
  })
})
