import { useCallback, useEffect, useRef, useState } from 'react'

interface TimerProps {
  initCount: number
  onFinished?: () => void
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
      setCount((prev) => {
        if (prev <= 0) {
          setIsRunning(false)
          return initCount
        }
        const next = prev - 1
        return next
      })
      setIsRunning(false)
    }, 1000)

    return () => cleanup()
  }, [isRunning, cleanup, initCount])

  useEffect(() => {
    if (count <= 0) {
      onFinished?.()
      cleanup()
      return
    }
  }, [count, onFinished, cleanup])

  return { count, start, pause, reset }
}
