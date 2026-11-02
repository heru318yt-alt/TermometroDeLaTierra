import type { ReactNode } from 'react'
export function PageIntro({ number, title, eyebrow, children }: { number: string; title: string; eyebrow?: string; children: ReactNode }) {
  return <header className="page-intro">
    <div className="page-intro-rail"><span className="page-intro-number">{number}</span><span className="page-intro-rule" aria-hidden="true" /><span className="eyebrow">{eyebrow ?? 'TERMÓMETRO DE LA TIERRA'}</span></div>
    <h1>{title}</h1>
    <p className="intro-copy">{children}</p>
  </header>
}
