import * as React from 'react'
import { SocketAdapter } from '../adapters/SocketAdapter'
import { WebRTCConnectionCreator } from '../connection-creator/WebRTCConnectionCreator'
import { WebRTCConnections } from '../connections/WebRTCConnections'
import { CONNECTION_STATE } from '../constants'
import { SyncStateProps } from '../types'
import { SyncStateContext } from './SyncStateContext'

/**
 * Connection を提供するプロバイダ
 */
export const SyncStateProvider: React.FC<
  React.PropsWithChildren<SyncStateProps>
> = ({ children, options }) => {
  const isBooted = React.useRef<boolean>(false)
  const [connections, setConnections] =
    React.useState<WebRTCConnections | null>(null)

  const { connect, disconnect, roomName, dataChannelLabel, ...rest } = options
  const adapter = React.useMemo(
    () => new SocketAdapter(connect, disconnect),
    [connect, disconnect]
  )
  const connectionCreator = React.useMemo(
    () => new WebRTCConnectionCreator(adapter),
    [adapter]
  )

  const bootstrap = React.useCallback(async () => {
    if (isBooted.current) return
    isBooted.current = true

    const connections = await connectionCreator.create({
      roomName: roomName || 'default-room',
      dataChannelLabel: dataChannelLabel || 'default-channel',
      ...rest
    })
    setConnections(connections)

    return () => {
      connections.close()
      setConnections(null)
      adapter.disconnect()
      isBooted.current = false
    }
  }, [adapter, connectionCreator, dataChannelLabel, rest, roomName])

  React.useEffect(() => {
    ;(async () => {
      const unsubscribe = await bootstrap()
      return () => unsubscribe && unsubscribe()
    })()
  }, [bootstrap])

  if (!connections || connections.state === CONNECTION_STATE.CLOSED) return null

  return <SyncStateContext value={{ connections }}>{children}</SyncStateContext>
}
