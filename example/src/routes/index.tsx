import { useApp } from '../contexts/AppContext'
import { Page } from '../types/state'
import { Daytime } from './Daytime'
import { Intro } from './Intro'
import { Midnight } from './Midnight'
import { Result } from './Result'

export const Routes = () => {
  const { state } = useApp()
  switch (state.page) {
    case Page.INTRO:
      return <Intro />
    case Page.DAYTIME:
      return <Daytime />
    case Page.MIDNIGHT:
      return <Midnight />
    case Page.RESULT:
      return <Result />
    default:
      throw new Error('not found')
  }
}
