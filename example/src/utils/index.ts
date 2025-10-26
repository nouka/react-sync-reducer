import type { CustomEventType, Handler } from 'react-sync-reducer'

export const customEventListener = <T>(
  type: CustomEventType,
  handler: Handler<T>
) => {
  const listener = (e: Event) => handler((e as CustomEvent).detail)
  window.addEventListener(type, listener, false)
  return () => window.removeEventListener(type, listener, false)
}
