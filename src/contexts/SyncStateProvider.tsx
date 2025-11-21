import * as React from 'react'
import { SocketAdapter } from '../adapters/SocketAdapter'
import { WebRTCConnectionCreator } from '../connection-creator/WebRTCConnectionCreator'
import { WebRTCConnections } from '../connections/WebRTCConnections'
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

  const { initialize, roomName, dataChannelLabel, ...rest } = options
  const adapter = React.useMemo(
    () => new SocketAdapter(initialize),
    [initialize]
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
      isBooted.current = false
    }
  }, [connectionCreator, dataChannelLabel, rest, roomName])

  React.useEffect(() => {
    ;(async () => {
      const unsubscribe = await bootstrap()
      return () => unsubscribe && unsubscribe()
    })()
  }, [bootstrap])

  if (!connections) return null

  const { host, me, isHost } = connectionCreator
  return (
    <SyncStateContext value={{ connections, host, me, isHost }}>
      {children}
    </SyncStateContext>
  )
}
