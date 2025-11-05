import { useApp } from './contexts/AppContext'
import { Daytime } from './routes/Daytime'
import { Intro } from './routes/Intro'
import { Midnight } from './routes/Midnight'
import { Result } from './routes/Result'
import { Page } from './types/state'

const App = () => {
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

export default App
