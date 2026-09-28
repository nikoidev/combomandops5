import { useTranslation } from 'react-i18next'
import { FACE_COLORS } from '../lib/buttons'
import type { PsButton } from '../lib/types'

const ARROWS: Partial<Record<PsButton, string>> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  LS_fwd: '↑',
  LS_back: '↓',
  LS_left: '←',
  LS_right: '→',
}

function FaceShape({ button, color }: { button: PsButton; color: string }) {
  const common = { fill: 'none', stroke: color, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (button) {
    case 'cross':
      return <path d="M7 7l10 10M17 7L7 17" {...common} />
    case 'circle':
      return <circle cx="12" cy="12" r="5.5" {...common} />
    case 'square':
      return <rect x="6.5" y="6.5" width="11" height="11" rx="1" {...common} />
    default:
      return <path d="M12 5.5l6.5 11h-13z" {...common} />
  }
}

type Props = { button: PsButton; size?: 'sm' | 'md' | 'lg' }

/** Icono de un botón del DualSense */
export function ButtonGlyph({ button, size = 'md' }: Props) {
  const { t } = useTranslation()
  const px = size === 'sm' ? 22 : size === 'lg' ? 44 : 30
  const label = t(`buttons.${button}`)
  const face = FACE_COLORS[button]

  if (face) {
    return (
      <svg width={px} height={px} viewBox="0 0 24 24" role="img" aria-label={label} className="shrink-0">
        <title>{label}</title>
        <circle cx="12" cy="12" r="11" fill="#1b1f2a" stroke="#3a4050" />
        <FaceShape button={button} color={face} />
      </svg>
    )
  }

  const isStick = button.startsWith('LS_')
  const isDpad = ['up', 'down', 'left', 'right'].includes(button)
  const text = isStick || isDpad ? ARROWS[button] : button === 'touchpad' ? 'TP' : button === 'options' ? '≡' : button
  const shape = isStick ? 'rounded-full' : isDpad ? 'rounded-md' : 'rounded-lg'
  const fontSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-base' : 'text-xs'

  return (
    <span
      title={label}
      aria-label={label}
      role="img"
      style={{ height: px, minWidth: px }}
      className={`inline-flex shrink-0 items-center justify-center border border-[#3a4050] bg-[#1b1f2a] px-1 font-bold text-slate-100 ${shape} ${fontSize}`}
    >
      {isStick && <span className="mr-px text-[0.7em] text-slate-400">L</span>}
      {text}
    </span>
  )
}

/** Combinación de botones, p. ej. L2 + □ */
export function ButtonCombo({ buttons, size = 'md', hold }: { buttons: PsButton[]; size?: Props['size']; hold?: boolean }) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {buttons.map((b, i) => (
        <span key={b} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-slate-500">+</span>}
          <ButtonGlyph button={b} size={size} />
        </span>
      ))}
      {hold && <span className="ml-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-300">{t('editor.holdShort')}</span>}
    </span>
  )
}
