import { Fragment, useEffect, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { ActionType } from '../types/action'
import { Role, TimerStatus, VoteStatus, type Identifier } from '../types/state'

export const Daytime = () => {
  const { state, dispatch, me, isHost } = useApp()
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isHost) return
    dispatch({
      type: ActionType.TIMER_START,
      payload: {
        limit: 60
      }
    })
    const timer = setInterval(() => {
      dispatch({
        type: ActionType.TIMER_COUNTDOWN,
        payload: {
          current: state.timer.current++
        }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isHost])

  useEffect(() => {
    if (!isHost) return
    if (state.timer.status !== TimerStatus.STARTED) return
    if (state.timer.current < state.timer.limit) return

    dispatch({
      type: ActionType.TIMER_FINISHED
    })
    if (state.votes.status === VoteStatus.INITIALIZED) {
      dispatch({
        type: ActionType.TIMER_START,
        payload: {
          limit: 60
        }
      })
      dispatch({
        type: ActionType.VOTE_START
      })
      const timer = setInterval(() => {
        dispatch({
          type: ActionType.TIMER_COUNTDOWN,
          payload: {
            current: state.timer.current++
          }
        })
      }, 1000)
      return () => clearInterval(timer)
    }
    if (state.votes.status === VoteStatus.STARTED) {
      dispatch({
        type: ActionType.VOTE_FINISHED
      })
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
    }
  }, [isHost, state.timer.current, state.timer.limit, state.votes.status])

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
      <p>残り {state.timer.limit - state.timer.current} 秒</p>
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
