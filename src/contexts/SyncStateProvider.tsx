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

  const [connection, setConnection] = React.useState<ConnectionManager | null>(
    null
  )

  const bootstrap = React.useCallback(async () => {
    if (isBooted.current) return
    isBooted.current = true

    const { isHost, ...rest } = options
    const connection = new ConnectionManager(rest)
    const connectionState = await connection.connect(isHost)
    console.debug('connectionState=', connectionState)
    if (connectionState === ConnectionState.CONNECTED) {
      setConnection(connection)
    }

    return () => {
      connection.close()
      setConnection(null)
      isBooted.current = false
    }
  }, [])

  React.useEffect(() => {
    ;(async () => {
      const unsubscribe = await bootstrap()
      return () => unsubscribe && unsubscribe()
    })()
  }, [bootstrap])

  if (!connection) return null

  return (
    <SyncStateContext.Provider value={{ connection, isHost: options.isHost }}>
      {children}
    </SyncStateContext.Provider>
  )
}
