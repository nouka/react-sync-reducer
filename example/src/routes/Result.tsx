import { useApp } from '../contexts/AppContext'
import { Role } from '../types/state'

export const Result = () => {
  const { state } = useApp()
  const isWerewolfWin = state.participants.some(
    (participant) => participant.role === Role.WEREWOLF
  )
  return (
    <>
      <h1>Result</h1>
      {isWerewolfWin ? <p>人狼の勝利</p> : <p>村人の勝利</p>}
    </>
  )
}
