import type { ReactNode } from 'react'
export function PageIntro({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return <div className="page-intro"><p className="eyebrow">TERMÓMETRO DE LA TIERRA / {number}</p><h1>{title}</h1><p className="intro-copy">{children}</p></div>
}
