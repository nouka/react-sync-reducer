import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'

interface TimerProps {
  initCount: number
  onFinished: () => void
}

export const useTimer = ({ initCount, onFinished }: TimerProps) => {
  const [count, setCount] = useState(initCount)
  const [isRunning, setIsRunning] = useState(false)

  const timerRef = useRef<number>(undefined)

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = undefined
  }, [])

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    setIsRunning(false)
    setCount(initCount)
  }, [initCount])

  useEffect(() => {
    if (!isRunning) return

    cleanup()
    timerRef.current = setInterval(() => {
      setCount((prev) => prev - 1)
    }, 1000)

    return () => cleanup()
  }, [isRunning, cleanup, initCount])

  const effectReset = useEffectEvent(reset)
  const effectFinished = useEffectEvent(onFinished)
  useEffect(() => {
    if (count <= 0) {
      effectFinished()
      effectReset()
      cleanup()
      return
    }
  }, [count, cleanup])

  return { count, start, pause, reset }
}
