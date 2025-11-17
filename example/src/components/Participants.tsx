import type { useSyncReducer } from 'react-sync-reducer'
import type { Action } from '../types/action'
import type { State } from '../types/state'

const Roles = {
  WEREWOLF: '人狼',
  VILLAGER: '村人',
  SEER: '占い師'
} as const

export const Participants = ({
  participants,
  me,
  showRole = false
}: Pick<State, 'participants'> &
  Partial<Pick<ReturnType<typeof useSyncReducer<State, Action>>, 'me'>> & {
    showRole?: boolean
  }) => {
  return (
    <div className="grid grid-cols-4 gap-4 mt-4">
      {participants.map((participant) => {
        return (
          <div key={participant.id} className="">
            <p className="rounded-full bg-gray-700 text-center text-white aspect-square w-full flex items-center justify-center">
              {participant.name}
              <br />
              {participant.living ? '生存' : '死亡'}
            </p>
            {((me && participant.id === me) || showRole) && (
              <p className="text-center mt-2 rounded-full bg-gray-100">
                {Roles[participant.role]}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
