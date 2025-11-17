import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import { Debug } from '../components/Debug'
import { PageTitle } from '../components/PageTitle'
import { PageWrapper } from '../components/PageWrapper'
import { Participants } from '../components/Participants'
import { useApp } from '../contexts/app-hooks'
import { useTimer } from '../hooks/useTimer'
import { ActionType } from '../types/action'
import { Role, type Identifier } from '../types/state'
import { getVotingResults, groupBy, isGameOver } from '../utils'

export const Midnight = () => {
  const { state, dispatch, me, host, isHost, participant } = useApp()
  const [showRoleTarget, setShowRoleTarget] = useState<Identifier>()
  const effectDispatch = useEffectEvent(dispatch)

  const handleFinished = useCallback(() => {
    const grouped = groupBy(Object.entries(state.votes.vote), (item) => item[1])
    console.log('grouped', grouped)
    const target = getVotingResults(grouped)
    console.log('target', target)
    if (!isGameOver(state.participants, target)) {
      dispatch({
        type: ActionType.TO_DAYTIME,
        payload: {
          target
        }
      })
      return
    }
    dispatch({
      type: ActionType.TO_RESULT,
      payload: {
        target
      }
    })
  }, [dispatch, state.participants, state.votes.vote])

  const { count, start } = useTimer({
    initCount: 10,
    onFinished: handleFinished
  })

  useEffect(() => {
    if (!isHost) return
    effectDispatch({
      type: ActionType.TIMER_COUNTDOWN,
      payload: {
        current: count
      }
    })
  }, [isHost, count])

  useEffect(() => {
    if (!isHost) return
    effectDispatch({
      type: ActionType.VOTE_START
    })
    start()
  }, [isHost, start])

  if (!participant) return null

  const handleSendVote = (id: Identifier) => {
    dispatch({
      type: ActionType.VOTE,
      payload: {
        from: me,
        to: id
      }
    })
  }

  const handleShowRole = (id: Identifier) => {
    setShowRoleTarget(id)
  }

  const imWerewolf = participant.role === Role.WEREWOLF
  const imFortuneTeller = participant.role === Role.FORTUNE_TELLER

  return (
    <PageWrapper>
      <PageTitle label="夜：人狼が村人を襲います" />
      <Debug me={me} host={host} isHost={isHost} />
      <div className="p-4 bg-gray-200 rounded">
        <p>残り {state.timer.current} 秒</p>
        {imWerewolf && (
          <ul>
            {state.participants
              .filter((participant) => participant.role !== Role.WEREWOLF)
              .map((participant) => {
                const { id, name } = participant
                return (
                  <li
                    key={`vote-${id}`}
                    className="flex justify-between align-middle mb-2"
                  >
                    <p
                      className={
                        state.votes.vote[me] === id ? 'text-red-800' : ''
                      }
                    >
                      {name} さん
                    </p>
                    <button
                      onClick={() => handleSendVote(id)}
                      className="bg-blue-700 text-white rounded px-4"
                    >
                      この人を喰う
                    </button>
                  </li>
                )
              })}
          </ul>
        )}
        {imFortuneTeller && (
          <ul>
            {state.participants.map((participant) => {
              const { id, name } = participant
              return (
                <li
                  key={`show-role-${id}`}
                  className="flex justify-between align-middle mb-2"
                >
                  <p className="">{name} さん</p>
                  <button
                    onClick={() => handleShowRole(id)}
                    className="bg-blue-700 text-white rounded px-4"
                  >
                    この人を占う
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <Participants
        participants={state.participants}
        me={me}
        showRole={
          (imWerewolf && participant.role === Role.WEREWOLF) ||
          showRoleTarget === participant.id
        }
      />
    </PageWrapper>
  )
}
