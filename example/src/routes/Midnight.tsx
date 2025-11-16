import {
  Fragment,
  useCallback,
  useEffect,
  useEffectEvent,
  useState
} from 'react'
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
    <>
      <h1>Midnight</h1>
      <p>YourId: {new String(me)}</p>
      <p>HostId: {new String(host)}</p>
      <p>isHost: {new String(isHost)}</p>
      <p>{participant.name} さん</p>
      <p>あなたは {participant.role} です</p>
      <p>{participant.living ? '生存' : '死亡'}</p>
      <p>残り {state.timer.current} 秒</p>
      {imWerewolf && (
        <ul>
          {state.participants
            .filter((participant) => participant.role !== Role.WEREWOLF)
            .map((participant) => {
              const { id, name } = participant
              return (
                <li key={`vote-${id}`}>
                  {name} {state.votes.vote[me] === id && 'selected'}
                  <br />
                  <button onClick={() => handleSendVote(id)}>
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
              <li key={`show-role-${id}`}>
                {name}
                <br />
                <button onClick={() => handleShowRole(id)}>この人を占う</button>
              </li>
            )
          })}
        </ul>
      )}
      {state.participants.map((participant) => {
        return (
          <Fragment key={participant.id}>
            <p>name: {participant.name}</p>
            <p>id: {participant.id}</p>
            {((imWerewolf && participant.role === Role.WEREWOLF) ||
              showRoleTarget === participant.id) && <p>{participant.role}</p>}
            <p>{participant.living ? 'living' : 'dead'}</p>
          </Fragment>
        )
      })}
    </>
  )
}
