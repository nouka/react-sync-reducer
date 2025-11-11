import { Fragment, useCallback, useEffect, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { useTimer } from '../hooks/useTimer'
import { ActionType } from '../types/action'
import { Role, VoteStatus, type Identifier } from '../types/state'

export const Midnight = () => {
  const { state, dispatch, me, isHost } = useApp()
  const [message, setMessage] = useState('')

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
        type: ActionType.TO_DAYTIME,
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

  const { count, start } = useTimer({
    initCount: 10,
    onFinished: handleFinished
  })

  useEffect(() => {
    if (!isHost) return
    dispatch({
      type: ActionType.TIMER_COUNTDOWN,
      payload: {
        current: count
      }
    })
  }, [isHost, count])

  useEffect(() => {
    if (!isHost) return
    dispatch({
      type: ActionType.VOTE_START
    })
    start()
  }, [isHost, start])

  const participant = state.participants.find(
    (participant) => participant.id === me
  )
  if (!participant) return null

  const handleSendMessage = () => {
    dispatch({
      type: ActionType.PRIVATE_MESSAGE,
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
      <h1>Midnight</h1>
      <p>{participant.name} さん</p>
      <p>あなたは {participant.role} です</p>
      <p>残り {state.timer.current} 秒</p>
      {participant.role === Role.WEREWOLF && (
        <>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={handleSendMessage}>Send Public Message</button>
          {state.privateMessages.map((privateMessage) => {
            const { id, message } = privateMessage
            const participant = state.participants.find(
              (participant) => participant.id === id
            )
            if (!participant) return null
            const { name } = participant
            return (
              <Fragment key={`private-message-${id}`}>
                <p>{name}</p>
                <p>{message}</p>
              </Fragment>
            )
          })}
          {state.votes.status === VoteStatus.STARTED &&
            state.participants
              .filter((participant) => participant.role !== Role.WEREWOLF)
              .map((participant) => {
                const { id, name } = participant
                return (
                  <Fragment key={`vote-${id}`}>
                    {name} {state.votes.vote[me] === id && 'selected'}
                    <button onClick={() => handleSendVote(id)}>
                      この人を喰う
                    </button>
                  </Fragment>
                )
              })}
        </>
      )}
    </>
  )
}
