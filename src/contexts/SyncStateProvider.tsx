import * as React from 'react'
import { ConnectionManager } from '../connection-manager/ConnectionManager'
import { ConnectionState } from '../constants'
import { ISyncStateContext, SyncStateProps } from '../types'

/**
 * Connection を共有するためのコンテキスト
 */
export const SyncStateContext = React.createContext({} as ISyncStateContext)

/**
 * Connection を提供するプロバイダ
 */
export const SyncStateProvider: React.FC<
  React.PropsWithChildren<SyncStateProps>
> = ({ children, options }) => {
  const isBooted = React.useRef<boolean>(false)
  const connection = React.useMemo(
    () => new ConnectionManager(options),
    [options]
  )

  const [isConnected, setIsConnected] = React.useState<boolean>(false)

  const bootstrap = React.useCallback(async () => {
    if (isBooted.current) return
    isBooted.current = true

    const connectionState = await connection.connect()
    console.debug('connectionState=', connectionState)
    if (connectionState === ConnectionState.CONNECTED) {
      setIsConnected(true)
    }

    return () => {
      connection.close()
      setIsConnected(false)
      isBooted.current = false
    }
  }, [])

  React.useEffect(() => {
    ;(async () => {
      const unsubscribe = await bootstrap()
      return () => unsubscribe && unsubscribe()
    })()
  }, [bootstrap])

  if (!isConnected) return null

  return (
    <SyncStateContext.Provider value={{ connection }}>
      {children}
    </SyncStateContext.Provider>
  )
}
