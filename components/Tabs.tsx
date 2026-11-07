'use client'
import { useState } from 'react'

export default function Tabs({ tabs }: { tabs: { id: string; label: string; content: React.ReactNode }[] }) {
  const [cur, setCur] = useState(tabs[0]?.id)
  return (
    <div className="stack gap-20">
      <div role="tablist" className="tabs">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={cur === t.id} className={`tab${cur === t.id ? ' on' : ''}`} onClick={() => setCur(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" hidden={cur !== t.id}>{t.content}</div>
      ))}
    </div>
  )
}
