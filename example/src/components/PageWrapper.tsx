import type { PropsWithChildren } from 'react'

export const PageWrapper = ({ children }: PropsWithChildren) => (
  <div className="p-6">{children}</div>
)
