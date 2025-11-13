import { useApp } from '../contexts/app-hooks'
import { Role } from '../types/state'
import { getWinner } from '../utils'

export const Result = () => {
  const { state, me, host, isHost, participant } = useApp()
  if (!participant) return null
  const winner = getWinner(state.participants)
  return (
    <>
      <h1>Result</h1>
      <p>YourId: {new String(me)}</p>
      <p>HostId: {new String(host)}</p>
      <p>isHost: {new String(isHost)}</p>
      <p>{participant.name} さん</p>
      <p>あなたは {participant.role} です</p>
      <p>{participant.living ? '生存' : '死亡'}</p>
      {winner === Role.WEREWOLF ? <p>人狼の勝利</p> : <p>村人の勝利</p>}
    </>
  )
}
