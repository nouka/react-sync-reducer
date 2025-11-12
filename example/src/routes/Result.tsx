import { useApp } from '../contexts/AppContext'
import { Role } from '../types/state'

export const Result = () => {
  const { state, me, host, isHost } = useApp()
  const isWerewolfWin = state.participants
    .filter((participant) => participant.living)
    .some((participant) => participant.role === Role.WEREWOLF)
  const participant = state.participants.find(
    (participant) => participant.id === me
  )
  if (!participant) return null
  return (
    <>
      <h1>Result</h1>
      <p>YourId: {new String(me)}</p>
      <p>HostId: {new String(host)}</p>
      <p>isHost: {new String(isHost)}</p>
      <p>{participant.name} さん</p>
      <p>あなたは {participant.role} です</p>
      <p>{participant.living ? '生存' : '死亡'}</p>
      {isWerewolfWin ? <p>人狼の勝利</p> : <p>村人の勝利</p>}
    </>
  )
}
