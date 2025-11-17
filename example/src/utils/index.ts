import { Role, type Identifier, type State } from '../types/state'

export const shuffle = <T>(array: T[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1))
    const tmp = array[i]
    array[i] = array[r]
    array[r] = tmp
  }
}

export const prepareRoles = (
  participants: Pick<State, 'participants'>['participants']
) => {
  const r = [Role.VILLAGER, Role.SEER, Role.WEREWOLF]
  const remain = Math.max(participants.length - r.length, 0)
  for (let i = 0; i < remain; i++) {
    r.push((i + 1) % 4 === 0 ? Role.WEREWOLF : Role.VILLAGER)
  }
  shuffle(r)
  return r
}

export const groupBy = <K extends PropertyKey, V>(
  array: readonly V[],
  getKey: (cur: V, idx: number, src: readonly V[]) => K
) => {
  return array.reduce((obj, cur, idx, src) => {
    const key = getKey(cur, idx, src)
    ;(obj[key] || (obj[key] = []))!.push(cur)
    return obj
  }, {} as Partial<Record<K, V[]>>)
}

export const getVotingResults = (
  grouped: Partial<Record<Identifier, [string, Identifier][]>>
) => {
  const chosen = Object.entries(grouped).reduce(
    (a, b) => {
      return (a[1] || []).length > (b[1] || []).length
        ? a
        : (a[1] || []).length < (b[1] || []).length
        ? b
        : ['', [['', '']]]
    },
    ['', [['', '']]]
  )[0]
  if (chosen === '') return undefined
  return chosen as Identifier
}

export const isGameOver = (
  participants: Pick<State, 'participants'>['participants'],
  target: Identifier | undefined
) => {
  if (!target) return false
  const living = participants.filter((p) => p.living && p.id !== target)
  return (
    living.every((p) => p.role === Role.WEREWOLF) ||
    living.every((p) => p.role !== Role.WEREWOLF)
  )
}

export const getWinner = (
  participants: Pick<State, 'participants'>['participants']
) => {
  return participants
    .filter((p) => p.living)
    .some((p) => p.role === Role.WEREWOLF)
    ? Role.WEREWOLF
    : Role.VILLAGER
}
