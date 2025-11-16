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
import { VoteStatus, type Identifier } from '../types/state'
import { getVotingResults, groupBy, isGameOver } from '../utils'

export const Daytime = () => {
  const { state, dispatch, me, host, isHost, participant } = useApp()

  const [message, setMessage] = useState('')
  const effectDispatch = useEffectEvent(dispatch)

  const handleVoteStart = useCallback(() => {
    dispatch({
      type: ActionType.VOTE_START
    })
  }, [dispatch])

  const handleFinished = useCallback(() => {
    const grouped = groupBy(Object.entries(state.votes.vote), (item) => item[1])
    console.log('grouped', grouped)
    const target = getVotingResults(grouped)
    console.log('target', target)
    if (!isGameOver(state.participants, target)) {
      dispatch({
        type: ActionType.TO_NIGHT,
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

  const discussionTimer = useTimer({
    initCount: 10,
    onFinished: handleVoteStart
  })
  const voteTimer = useTimer({
    initCount: 10,
    onFinished: handleFinished
  })

  useEffect(() => {
    if (!isHost) return
    effectDispatch({
      type: ActionType.TIMER_COUNTDOWN,
      payload: {
        current: discussionTimer.count
      }
    })
  }, [isHost, discussionTimer.count])

  useEffect(() => {
    if (!isHost) return
    effectDispatch({
      type: ActionType.TIMER_COUNTDOWN,
      payload: {
        current: voteTimer.count
      }
    })
  }, [isHost, voteTimer.count])

  useEffect(() => {
    if (!isHost) return
    discussionTimer.start()
  }, [isHost, discussionTimer.start, discussionTimer])

  useEffect(() => {
    if (!isHost) return
    if (state.votes.status !== VoteStatus.STARTED) return
    voteTimer.start()
  }, [isHost, state.votes.status, voteTimer])

  if (!participant) return null

  const handleSendMessage = () => {
    dispatch({
      type: ActionType.PUBLIC_MESSAGE,
      payload: {
        id: me,
        message
      }
    })
    setMessage('')
  }

  const handleSendVote = (id: Identifier) => {
    dispatch({
      type: ActionType.VOTE,
      payload: {
        from: me,
        to: id
      }
    })
  }

  return (
    <>
      <h1>Daytime</h1>
      <p>YourId: {new String(me)}</p>
      <p>HostId: {new String(host)}</p>
      <p>isHost: {new String(isHost)}</p>
      <p>{participant.name} さん</p>
      <p>あなたは {participant.role} です</p>
      <p>{participant.living ? '生存' : '死亡'}</p>
      <p>残り {state.timer.current} 秒</p>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleSendMessage}>Send Public Message</button>
      {state.votes.status === VoteStatus.INITIALIZED &&
        state.publicMessages.map((publicMessage) => {
          const { id, message } = publicMessage
          const participant = state.participants.find(
            (participant) => participant.id === id
          )
          if (!participant) return null
          const { name } = participant
          return (
            <Fragment key={`public-message-${id}`}>
              <p>{name}</p>
              <p>{message}</p>
            </Fragment>
          )
        })}
      <ul>
        {state.votes.status === VoteStatus.STARTED &&
          !state.votes.vote[me] &&
          state.participants.map((participant) => {
            const { id, name } = participant
            return (
              <li key={`vote-${id}`}>
                {name}
                <br />
                <button onClick={() => handleSendVote(id)}>この人が人狼</button>
              </li>
            )
          })}
      </ul>
      {state.participants.map((participant) => {
        return (
          <Fragment key={participant.id}>
            <p>name: {participant.name}</p>
            <p>id: {participant.id}</p>
            <p>{participant.living ? 'living' : 'dead'}</p>
          </Fragment>
        )
      })}
    </>
  )
}
