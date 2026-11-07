import { diffLines } from 'diff'

type Line = { kind: 'add' | 'del' | 'ctx' | 'gap'; num: number | null; text: string }

const CONTEXT = 3

/** Line diff between the live version and the candidate; unchanged stretches are folded. */
export function buildDiff(before: string, after: string) {
  const parts = diffLines(before, after)
  const raw: Line[] = []
  let newNum = 1
  let oldNum = 1
  let added = 0
  let removed = 0
  for (const p of parts) {
    const lines = p.value.replace(/\n$/, '').split('\n')
    for (const text of lines) {
      if (p.added) { raw.push({ kind: 'add', num: newNum++, text }); added++ }
      else if (p.removed) { raw.push({ kind: 'del', num: oldNum++, text }); removed++ }
      else { raw.push({ kind: 'ctx', num: newNum++, text }); oldNum++ }
    }
  }
  const keep = raw.map(() => false)
  raw.forEach((l, i) => {
    if (l.kind !== 'ctx') for (let j = Math.max(0, i - CONTEXT); j <= Math.min(raw.length - 1, i + CONTEXT); j++) keep[j] = true
  })
  const out: Line[] = []
  let skipped = 0
  raw.forEach((l, i) => {
    if (keep[i]) {
      if (skipped) { out.push({ kind: 'gap', num: null, text: `… ${skipped} строк без изменений` }); skipped = 0 }
      out.push(l)
    } else skipped++
  })
  if (skipped) out.push({ kind: 'gap', num: null, text: `… ${skipped} строк без изменений` })
  return { lines: out, added, removed }
}

export function CodeLines({ lines }: { lines: Line[] }) {
  return (
    <div className="code-box">
      {lines.map((l, i) => (
        <div key={i} className={`code-line ${l.kind}`}>
          <span className="num">{l.num ?? ''}</span>
          <span className="sign">{l.kind === 'add' ? '+' : l.kind === 'del' ? '−' : ''}</span>
          <span className="txt">{l.text}</span>
        </div>
      ))}
    </div>
  )
}

export function plainLines(code: string): Line[] {
  return code.split('\n').map((text, i) => ({ kind: 'add' as const, num: i + 1, text }))
}
