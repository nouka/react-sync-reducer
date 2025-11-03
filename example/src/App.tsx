import { useSyncReducer } from 'react-sync-reducer'
import { ActionType } from './types/action'
import { reducer } from './reducers'

const App = () => {
  const { state, dispatch } = useSyncReducer(reducer)

  // TODO: もう少しリッチなゲームを作成する
  // 人狼ゲームにする（https://ja.wikipedia.org/wiki/%E4%BA%BA%E7%8B%BC%E3%82%B2%E3%83%BC%E3%83%A0）
  // 役職は人狼、村人、占い師のみ
  // 昼、夜のパート
  // 夜のパートでは、村人は他の役職の行動終了を待つ、人狼は一人を指定し殺害、占い師は一人を指定し村人か否かを知る
  // 昼のパートでは、前日の殺害者を公表（初日以外）、誰が人狼かを投票し殺害
  // 昼のパートの推理は、メッセージチャットで行う（メッセージは全記録が残る）
  // 人狼同士はお互いを知ることができるため、人狼オンリーのチャットが存在する
  // 昼のパートは投票とメッセージチャットで時間制限付き
  // 人狼のプライベートチャットは常に存在
  // 終了条件は、人狼がすべて殺害、村人と占い師の人数が人狼以下になった場合
  // 最初はデザインは適当で、テキストのみで構成
  return (
    <>
      <p>{state.sharedString}</p>
      <button
        onClick={() =>
          dispatch({
            type: ActionType.ENTRY,
            payload: {
              someActionParameter: 'someAction'
            }
          })
        }
      >
        entryActionButton
      </button>
      <button
        onClick={() =>
          dispatch({
            type: ActionType.EXIT,
            payload: undefined
          })
        }
      >
        exitActionButton
      </button>
    </>
  )
}

export default App
