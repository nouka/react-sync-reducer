import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import { Debug } from '../components/Debug'
import { PageTitle } from '../components/PageTitle'
import { PageWrapper } from '../components/PageWrapper'
import { Participants } from '../components/Participants'
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
    initCount: 100,
    onFinished: handleVoteStart
  })
  const voteTimer = useTimer({
    initCount: 100,
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
    <PageWrapper>
      <PageTitle label="昼：誰が人狼か探りましょう" />
      <Debug me={me} host={host} isHost={isHost} />
      {state.votes.status === VoteStatus.INITIALIZED && (
        <div className="p-4 bg-gray-200 rounded">
          <p className="mb-4">
            メッセージ入力（残り {state.timer.current} 秒）
          </p>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-white rounded p-2 mb-4 w-full"
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white rounded p-2 w-full"
          >
            メッセージ送信
          </button>
          <div className="h-32 overflow-y-auto bg-gray-100 rounded p-2 flex flex-col-reverse">
            {state.publicMessages.map((publicMessage, index) => {
              const { id, message } = publicMessage
              const participant = state.participants.find(
                (participant) => participant.id === id
              )
              if (!participant) return null
              const { name } = participant
              return (
                <div
                  key={`public-message-${id}-${index}`}
                  className="flex flex-row-reverse justify-between align-middle mb-2"
                >
                  <p className="text-xs">{name}</p>
                  <p className="">{message}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {state.votes.status === VoteStatus.STARTED && (
        <div className="p-4 bg-gray-200 rounded">
          <p className="mb-4">投票（残り {state.timer.current} 秒）</p>
          <ul>
            {!state.votes.vote[me] &&
              state.participants.map((participant) => {
                const { id, name } = participant
                return (
                  <li
                    key={`vote-${id}`}
                    className="flex justify-between align-middle mb-2"
                  >
                    <p className="">{name} さん</p>
                    <button
                      onClick={() => handleSendVote(id)}
                      className="bg-blue-700 text-white rounded px-4"
                    >
                      この人が人狼
                    </button>
                  </li>
                )
              })}
          </ul>
        </div>
      )}
      <Participants participants={state.participants} me={me} />
    </PageWrapper>
  )
}
