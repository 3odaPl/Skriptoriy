'use client'
import { useState } from 'react'
import { screenshotUrl } from '@/lib/util'

export default function Gallery({ paths, title }: { paths: string[]; title: string }) {
  const [i, setI] = useState(0)
  if (paths.length === 0) return <div className="gallery-main ph">Автор не добавил скриншоты</div>
  return (
    <div className="stack gap-12">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={screenshotUrl(paths[i])} alt={`${title} — скриншот ${i + 1}`} className="gallery-main" />
      {paths.length > 1 && (
        <div className="gallery-thumbs">
          {paths.map((p, idx) => (
            <button key={p} type="button" className={`gallery-thumb${idx === i ? ' on' : ''}`} onClick={() => setI(idx)} aria-label={`Скриншот ${idx + 1}`} aria-pressed={idx === i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={screenshotUrl(p)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
