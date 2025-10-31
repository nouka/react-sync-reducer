import { ConnectionState } from '../constants'

// TODO: interface, 定数の分離

export interface Config {}
export interface Connection {
  close(): ConnectionState
}
