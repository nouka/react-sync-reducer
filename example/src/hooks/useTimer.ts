import { useCallback, useEffect, useRef, useState } from 'react'

interface TimerProps {
  initCount: number
  onStart?: () => void
  onFinished?: () => void
}

export const useTimer = ({ initCount, onStart, onFinished }: TimerProps) => {
  const [count, setCount] = useState(initCount)
  const [isRunning, setIsRunning] = useState(false)

  const timerRef = useRef<number>(undefined)

  const cleanup = () => {
    clearInterval(timerRef.current)
    timerRef.current = undefined
  }

  const start = useCallback(() => {
    onStart?.()
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
  }, [isRunning, cleanup])

  useEffect(() => {
    if (count <= 0) {
      onFinished?.()
      reset()
      cleanup()
      return
    }
  }, [count, onFinished, reset, cleanup])

  return { count, start, pause, reset }
}
