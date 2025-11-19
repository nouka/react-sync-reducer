import * as React from 'react'
import { ConnectionManager } from '../connection-manager/ConnectionManager'
import { ConnectionState } from '../constants'
import { SyncStateProps } from '../types'
import { SyncStateContext } from './SyncStateContext'

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

    const connection = new ConnectionManager(options)
    const connectionState = await connection.connect()
    console.debug('connectionState=', connectionState)
    if (connectionState === ConnectionState.CONNECTED) {
      setConnection(connection)
    }

    return () => {
      connection.close()
      setConnection(null)
      isBooted.current = false
    }
  }, [options])

  React.useEffect(() => {
    ;(async () => {
      const unsubscribe = await bootstrap()
      return () => unsubscribe && unsubscribe()
    })()
  }, [bootstrap])

  if (!connection) return null

  return <SyncStateContext value={{ connection }}>{children}</SyncStateContext>
}
