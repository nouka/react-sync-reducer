import { useMemo, useState } from 'react'
import { useApp } from '../contexts/app-hooks'
import { ActionType } from '../types/action'
import { Role } from '../types/state'
import { prepareRoles } from '../utils'

export const Intro = () => {
  const { state, dispatch, me, isHost, host, participant } = useApp()
  const [name, setName] = useState<string>('')

  const roleStack = useMemo(
    () => prepareRoles(state.participants),
    [state.participants]
  )

  return (
    <>
      <h1>Intro</h1>
      <p>YourId: {new String(me)}</p>
      <p>HostId: {new String(host)}</p>
      <p>isHost: {new String(isHost)}</p>
      {(() => {
        if (!participant) {
          return (
            <>
              <p>名前を入力してください</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                onClick={() =>
                  dispatch({
                    type: ActionType.ENTRY,
                    payload: {
                      id: me,
                      name
                    }
                  })
                }
              >
                Entry
              </button>
            </>
          )
        }
        if (!isHost) {
          return (
            <>
              <p>{participant.name} さん</p>
              <p>ホストがゲームを開始するのをお待ちください</p>
            </>
          )
        }
        return (
          <>
            <p>{participant.name} さん</p>
            <p>ゲームを開始しますか？</p>
            <button
              onClick={() =>
                dispatch({
                  type: ActionType.START,
                  payload: state.participants.map((participant) => {
                    const { id } = participant
                    return { id, role: roleStack.pop() ?? Role.VILLAGER }
                  })
                })
              }
            >
              ゲームスタート
            </button>
          </>
        )
      })()}
    </>
  )
}
