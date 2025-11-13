import { useContext } from 'react'
import { AppContext } from './AppContext'

export const useApp = () => {
  return useContext(AppContext)
}
