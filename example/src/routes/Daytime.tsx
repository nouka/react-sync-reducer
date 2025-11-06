import { useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import { ActionType } from '../types/action'

export const Daytime = () => {
  const { state, dispatch, me, isHost } = useApp()

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
    if (state.timer.current >= state.timer.limit) {
      dispatch({
        type: ActionType.TIMER_FINISHED
      })
    }
  }, [isHost, state.timer.current, state.timer.limit])

  const participant = state.participants.find(
    (participant) => participant.id === me
  )
  if (!participant) return null

  return (
    <>
      <h1>Daytime</h1>
      <p>{participant.name} さん</p>
      <p>あなたは {participant.role} です</p>
    </>
  )
}
