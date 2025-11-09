import { useCallback, useMemo, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { ActionType } from '../types/action'
import { Role } from '../types/state'

export const Intro = () => {
  const { state, dispatch, me, isHost, host } = useApp()
  const [name, setName] = useState<string>('')
  const participant = useMemo(
    () => state.participants.find((participant) => participant.id === me),
    [state.participants.length]
  )

  const shuffle = useCallback(<T extends unknown>(array: T[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1))
      const tmp = array[i]
      array[i] = array[r]
      array[r] = tmp
    }
  }, [])

  const roleStack = useMemo(() => {
    let r = [Role.VILLAGER, Role.FORTUNE_TELLER, Role.WEREWOLF]
    const remain = Math.max(state.participants.length - r.length, 0)
    for (let i = 0; i < remain; i++) {
      ;(i + 1) % 4 === 0 ? r.push(Role.WEREWOLF) : r.push(Role.VILLAGER)
    }
    shuffle(r)
    return r
  }, [state.participants.length, shuffle])

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
