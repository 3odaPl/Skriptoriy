import type { Autocheck } from '@/lib/util'

const ICON = { ok: '✓', warn: '!', danger: '✕' } as const
const COLOR = { ok: 'var(--ok)', warn: 'var(--accent)', danger: 'var(--bad)' } as const

export default function AutocheckList({ check }: { check: Autocheck }) {
  return (
    <div className="stack gap-8">
      {check.items.map((it, i) => (
        <div key={i} className="row gap-8" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          <span aria-hidden="true" style={{ color: COLOR[it.level], fontWeight: 700, width: 16, flex: 'none' }}>{ICON[it.level]}</span>
          <span className="small" style={{ color: 'var(--text-2)', overflowWrap: 'anywhere' }}>
            <span className="sr-only">{it.level === 'ok' ? 'Хорошо: ' : it.level === 'warn' ? 'Внимание: ' : 'Опасно: '}</span>
            {it.text}
          </span>
        </div>
      ))}
    </div>
  )
}
