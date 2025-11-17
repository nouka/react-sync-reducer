import { Debug } from '../components/Debug'
import { PageTitle } from '../components/PageTitle'
import { PageWrapper } from '../components/PageWrapper'
import { Participants } from '../components/Participants'
import { useApp } from '../contexts/app-hooks'
import { Role } from '../types/state'
import { getWinner } from '../utils'

export const Result = () => {
  const { state, me, host, isHost, participant } = useApp()
  if (!participant) return null
  const winner = getWinner(state.participants)
  return (
    <PageWrapper>
      <PageTitle label="結果" />
      <Debug me={me} host={host} isHost={isHost} />
      <p className="text-center text-2xl mb-4 rounded-full bg-gray-200 p-4">
        {winner === Role.WEREWOLF ? '人狼の勝利' : '村人の勝利'}
      </p>
      <Participants participants={state.participants} me={me} />
    </PageWrapper>
  )
}
