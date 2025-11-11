import { Fragment, useCallback, useEffect, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { useTimer } from '../hooks/useTimer'
import { ActionType } from '../types/action'
import { Role, VoteStatus, type Identifier } from '../types/state'

export const Daytime = () => {
  const { state, dispatch, me, isHost } = useApp()

  const [message, setMessage] = useState('')

  const handleVoteStart = useCallback(() => {
    dispatch({
      type: ActionType.VOTE_START
    })
  }, [])

  const handleFinished = useCallback(() => {
    const grouped = Object.entries(state.votes.vote).reduce(
      (a: Record<string, Identifier[]>, r, _i, _v, k = r[0]) => {
        return (a[k] || (a[k] = [])).push(r[1]), a
      },
      {}
    )
    const target = Object.entries(grouped).reduce((a, b) => {
      return a[1].length >= b[1].length ? a : b
    })[0]
    if (
      state.participants
        .filter((participant) => participant.id !== target)
        .some((participant) => participant.role === Role.WEREWOLF) ||
      state.participants
        .filter((participant) => participant.id !== target)
        .some((participant) => participant.role !== Role.WEREWOLF)
    ) {
      dispatch({
        type: ActionType.TO_NIGHT,
        payload: {
          target
        }
      })
      return
    }
    dispatch({
      type: ActionType.TO_RESULT
    })
  }, [state.votes.vote, state.participants])

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
    dispatch({
      type: ActionType.TIMER_COUNTDOWN,
      payload: {
        current: discussionTimer.count
      }
    })
  }, [isHost, discussionTimer.count])

  useEffect(() => {
    if (!isHost) return
    dispatch({
      type: ActionType.TIMER_COUNTDOWN,
      payload: {
        current: voteTimer.count
      }
    })
  }, [isHost, voteTimer.count])

  useEffect(() => {
    if (!isHost) return
    discussionTimer.start()
  }, [isHost, discussionTimer.start])

  useEffect(() => {
    if (!isHost) return
    if (state.votes.status !== VoteStatus.STARTED) return
    voteTimer.start()
  }, [isHost, state.votes.status])

  const participant = state.participants.find(
    (participant) => participant.id === me
  )
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
      <p>{participant.name} さん</p>
      <p>あなたは {participant.role} です</p>
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
      {state.votes.status === VoteStatus.STARTED &&
        !state.votes.vote[me] &&
        state.participants.map((participant) => {
          const { id, name } = participant
          return (
            <Fragment key={`vote-${id}`}>
              {name}
              <button onClick={() => handleSendVote(id)}>この人が人狼</button>
            </Fragment>
          )
        })}
    </>
  )
}
