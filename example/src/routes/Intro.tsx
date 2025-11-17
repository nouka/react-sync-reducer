import { useMemo, useState } from 'react'
import { Debug } from '../components/Debug'
import { PageTitle } from '../components/PageTitle'
import { PageWrapper } from '../components/PageWrapper'
import { Participants } from '../components/Participants'
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
    <PageWrapper>
      <PageTitle label="エントリー" />
      <Debug me={me} host={host} isHost={isHost} />
      {(() => {
        if (!participant) {
          return (
            <div className="p-4 bg-gray-200 rounded">
              <p className="mb-4">名前を入力してください</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white rounded p-2 mb-4 w-full"
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
                className="bg-blue-500 text-white rounded p-2 w-full"
              >
                エントリーする
              </button>
            </div>
          )
        }
        if (!isHost) {
          return (
            <div className="p-4 bg-gray-200 rounded">
              <p className="mb-4">{participant.name} さん</p>
              <p>ホストがゲームを開始するのをお待ちください</p>
            </div>
          )
        }
        return (
          <div className="p-4 bg-gray-200 rounded">
            <p className="mb-4">{participant.name} さん</p>
            <p className="mb-4">ゲームを開始しますか？</p>
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
              className="bg-blue-500 text-white rounded p-2 w-full"
            >
              ゲームスタート
            </button>
          </div>
        )
      })()}
      <Participants participants={state.participants} />
    </PageWrapper>
  )
}
