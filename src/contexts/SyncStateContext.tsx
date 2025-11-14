import * as React from 'react'
import { ISyncStateContext } from '../types'

/**
 * Connection を共有するためのコンテキスト
 */
export const SyncStateContext = React.createContext({} as ISyncStateContext)
