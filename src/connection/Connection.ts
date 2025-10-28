import { Socket } from 'socket.io-client'
import SocketBuilder from '../adapters/SocketBuilder'
import { Receiver, WebRTCReceiver } from '../receiver/Receiver'
import { Sender, WebRTCSender } from '../sender/Sender'
import { Identifier } from '../types'

export const State = {
  CLOSED: 'CLOSED',
  CONNECTED: 'CONNECTED',
  PENDING: 'PENDING'
} as const

export type ConnectionState = (typeof State)[keyof typeof State]
export interface Config {}
export interface Connection {
  connect(config: Config): Promise<ConnectionState>
  close(): ConnectionState
  get sender(): Sender
  get receiver(): Receiver
  get host(): Identifier | undefined
  get isHost(): boolean
}

export interface WebRTCConfig extends Config {
  roomName: string
}
export class WebRTCConnection implements Connection {
  private senderInstance: WebRTCSender
  private receiverInstance: WebRTCReceiver
  private socket: Socket | undefined
  private id: Identifier | undefined
  private hostId: Identifier | undefined
  constructor() {
    this.senderInstance = new WebRTCSender()
    this.receiverInstance = new WebRTCReceiver()
    ;(async () => {
      const { socket, id } = await SocketBuilder.build()
      this.socket = socket
      this.id = id
    })()
  }
  public connect = (config: WebRTCConfig): Promise<ConnectionState> => {
    return new Promise<ConnectionState>((resolve) => {
      SocketBuilder.build().then(({ socket, id }) => {
        this.socket = socket
        this.id = id
        console.log('connected to signaling server. my id=', this.id)

        // 自動的にJOIN
        this.socket?.emit('SEND_ENTER', config.roomName)

        // 切断などで退室ユーザーを確認した場合
        this.socket?.on('LEAVE_USER', (data) => {
          console.log('LEAVE_USER', data)
          this.sender.closePeerConnection(data.id)
        })

        // Join Roomを受け付けてオファーを作成し送り返す
        this.socket?.on('RECEIVE_CALL', async (data) => {
          console.log('RECEIVE_CALL', data)
          const peerConnection = await this.sender.makeOfferToPeer(
            data.id,
            (evt) => {
              this.socket?.emit('SEND_CANDIDATE', {
                target: data.id,
                ice: evt.candidate
              })
            }
          )
          if (!peerConnection) return
          this.socket?.emit('SEND_SDP', {
            target: data.id,
            sdp: peerConnection.localDescription
          })
        })

        // SDPの受け付け
        // オファーの場合はアンサーを作成して送り返す
        // アンサーの場合はremoteDescriptionにセットして終了
        this.socket?.on('RECEIVE_SDP', async (sdp) => {
          console.log('RECEIVE_SDP', sdp)
          switch (sdp.type) {
            case 'offer': {
              const peerConnection = await this.sender.receiveOfferFromPeer(
                sdp,
                (evt) => {
                  this.socket?.emit('SEND_CANDIDATE', {
                    target: sdp.id,
                    ice: evt.candidate
                  })
                }
              )
              if (!peerConnection) return
              this.socket?.emit('SEND_SDP', {
                target: sdp.id,
                sdp: peerConnection.localDescription
              })
              return
            }
            case 'answer':
              await this.sender.receiveAnswerFromPeer(sdp)
              this.socket?.emit('START_GAME')
              this.id && (this.hostId = this.id)
              resolve(State.CONNECTED)
              return
            default:
              console.log('unkown sdp...')
              resolve(State.PENDING)
              return
          }
        })

        // ICE CANDIDATEの受け付け
        this.socket?.on('RECEIVE_CANDIDATE', (ice) => {
          console.log('RECEIVE_CANDIDATE', ice)
          this.sender.receiveCandidateFromPeer(ice)
        })

        // ホストのゲーム開始を受けて、クライアントがゲームを起動する処理
        this.socket?.on('STARTED_GAME', (id) => {
          this.hostId = id
          resolve(State.CONNECTED)
        })
      })
    })
  }
  public close = (): ConnectionState => {
    this.socket?.emit('SEND_EXIT')
    return State.CLOSED
  }
  get sender() {
    return this.senderInstance
  }
  get receiver() {
    return this.receiverInstance
  }
  get host() {
    return this.hostId
  }
  get isHost() {
    return this.id === this.hostId
  }
}
