import { useState } from 'react'
import { assetUrl } from '../lib/data'

type Props = { src: string | null | undefined; alt: string; size?: number; className?: string }

/** Icono de habilidad/clase con reserva si la imagen falta */
export function SkillIcon({ src, alt, size = 40, className = '' }: Props) {
  const [broken, setBroken] = useState(false)
  const style = { width: size, height: size }
  if (!src || broken) {
    return (
      <span
        style={style}
        className={`inline-flex shrink-0 items-center justify-center rounded-md border border-line bg-panel-2 text-xs font-bold text-muted ${className}`}
        aria-hidden
      >
        {alt.slice(0, 2).toUpperCase()}
      </span>
    )
  }
  return (
    <img
      src={assetUrl(src)}
      alt={alt}
      loading="lazy"
      style={style}
      onError={() => setBroken(true)}
      className={`shrink-0 rounded-md border border-line bg-black ${className}`}
    />
  )
}
