import { useState } from 'react'
import type { useSyncReducer } from 'react-sync-reducer'
import type { Action } from '../types/action'
import type { State } from '../types/state'

export const Debug = ({
  me,
  host,
  isHost
}: Pick<
  ReturnType<typeof useSyncReducer<State, Action>>,
  'me' | 'host' | 'isHost'
>) => {
  const [show, setShow] = useState(true)
  if (!import.meta.env.DEV) return null
  return (
    <div className="fixed bottom-1 right-1">
      {show && (
        <div className="p-2 bg-gray-700 text-white text-xs">
          <p>YourId: {new String(me)}</p>
          <p>HostId: {new String(host)}</p>
          <p>isHost: {new String(isHost)}</p>
        </div>
      )}
      <button
        className="border-2 border-blue-400 rounded absolute bottom-1 right-1 bg-white text-xs text-gray-700 px-1"
        onClick={() => setShow(!show)}
      >
        X
      </button>
    </div>
  )
}
