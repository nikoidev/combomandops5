import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { PsButton } from '../lib/types'
import { FACE_COLORS } from '../lib/buttons'

type Props = {
  /** Botones seleccionados para el paso */
  selected: Set<PsButton>
  /** Botones que se están pulsando en el mando físico */
  live?: Set<PsButton>
  onToggle?: (b: PsButton) => void
}

const BODY =
  'M150 78C200 58 400 58 450 78C520 96 566 190 586 290C598 352 560 392 516 360C482 334 462 296 410 296L190 296C138 296 118 334 84 360C40 392 2 352 14 290C34 190 80 96 150 78Z'

type BtnProps = {
  id: PsButton
  on: boolean
  pressed: boolean
  label: string
  onToggle?: (b: PsButton) => void
  children: (on: boolean, pressed: boolean) => ReactNode
}

// Se llama como función (no como componente) para que React no remonte los nodos en cada render
function BtnImpl({ id, on, pressed, label, onToggle, children }: BtnProps) {
  return (
    <g
      key={id}
      role="button"
      tabIndex={onToggle ? 0 : -1}
      aria-pressed={on}
      aria-label={label}
      className={`ds-btn ${onToggle ? 'cursor-pointer' : ''}`}
      onClick={() => onToggle?.(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle?.(id)
        }
      }}
    >
      <title>{label}</title>
      {children(on, pressed)}
    </g>
  )
}

/** Mando DualSense dibujado en SVG; cada botón es clicable y accesible con teclado */
export function DualSense({ selected, live, onToggle }: Props) {
  const { t } = useTranslation()

  const Btn = ({ id, children }: { id: PsButton; children: (on: boolean, pressed: boolean) => ReactNode }) =>
    BtnImpl({ id, children, on: selected.has(id), pressed: !!live?.has(id), onToggle, label: t(`buttons.${id}`) })

  const fill = (on: boolean, pressed: boolean) => (on ? 'var(--ds-on)' : pressed ? 'var(--ds-live)' : 'var(--ds-key)')
  const stroke = (on: boolean, pressed: boolean) => (on ? 'var(--ds-on-stroke)' : pressed ? 'var(--ds-live-stroke)' : 'var(--ds-key-stroke)')

  const shoulder = (id: PsButton, x: number, y: number, h: number, label: string) => (
    Btn({
      id,
      children: (on, p) => (
        <>
          <rect x={x} y={y} width={120} height={h} rx={h / 2.2} fill={fill(on, p)} stroke={stroke(on, p)} strokeWidth={2} />
          <text x={x + 60} y={y + h / 2 + 5} textAnchor="middle" className="ds-label">
            {label}
          </text>
        </>
      ),
    })
  )

  const face = (id: PsButton, cx: number, cy: number, shape: ReactNode) => (
    Btn({
      id,
      children: (on, p) => (
        <>
          <circle cx={cx} cy={cy} r={22} fill={fill(on, p)} stroke={stroke(on, p)} strokeWidth={2} />
          <g transform={`translate(${cx - 12} ${cy - 12})`} stroke={FACE_COLORS[id]} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round">
            {shape}
          </g>
        </>
      ),
    })
  )

  const dpad = (id: PsButton, x: number, y: number, rot: number) => (
    Btn({
      id,
      children: (on, p) => (
        <g transform={`translate(${x} ${y}) rotate(${rot})`}>
          <path d="M-15 -22 H15 V8 L0 22 L-15 8 Z" fill={fill(on, p)} stroke={stroke(on, p)} strokeWidth={2} />
          <path d="M-6 -4 L0 -12 L6 -4" fill="none" stroke="var(--ds-glyph)" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      ),
    })
  )

  // Palanca izquierda: cuatro direcciones + L3 en el centro
  const stickDir = (id: PsButton, rot: number) => (
    Btn({
      id,
      children: (on, p) => (
        <path
          transform={`translate(215 235) rotate(${rot})`}
          d="M-26 -30 A40 40 0 0 1 26 -30 L13 -15 A20 20 0 0 0 -13 -15 Z"
          fill={fill(on, p)}
          stroke={stroke(on, p)}
          strokeWidth={2}
        />
      ),
    })
  )

  return (
    <svg viewBox="0 0 600 390" className="h-auto w-full select-none" role="group" aria-label="DualSense">
      <path d={BODY} fill="var(--ds-body)" stroke="var(--ds-body-stroke)" strokeWidth={3} />

      {shoulder('L2', 110, 8, 30, 'L2')}
      {shoulder('R2', 370, 8, 30, 'R2')}
      {shoulder('L1', 110, 44, 22, 'L1')}
      {shoulder('R1', 370, 44, 22, 'R1')}

      {/* Panel táctil y Options */}
      {Btn({
        id: 'touchpad',
        children: (on, p) => <rect x={218} y={82} width={164} height={92} rx={14} fill={fill(on, p)} stroke={stroke(on, p)} strokeWidth={2} />,
      })}
      {Btn({
        id: 'options',
        children: (on, p) => <rect x={398} y={88} width={14} height={28} rx={7} fill={fill(on, p)} stroke={stroke(on, p)} strokeWidth={2} />,
      })}

      {dpad('up', 132, 148, 0)}
      {dpad('right', 172, 188, 90)}
      {dpad('down', 132, 228, 180)}
      {dpad('left', 92, 188, 270)}

      {face('triangle', 468, 138, <path d="M12 4l8 14H4z" />)}
      {face('circle', 516, 186, <circle cx="12" cy="12" r="8" />)}
      {face('cross', 468, 234, <path d="M5 5l14 14M19 5L5 19" />)}
      {face('square', 420, 186, <rect x="4.5" y="4.5" width="15" height="15" rx="1.5" />)}

      {/* Palanca izquierda */}
      <circle cx={215} cy={235} r={44} fill="var(--ds-well)" />
      {stickDir('LS_fwd', 0)}
      {stickDir('LS_right', 90)}
      {stickDir('LS_back', 180)}
      {stickDir('LS_left', 270)}
      {Btn({
        id: 'L3',
        children: (on, p) => (
          <>
            <circle cx={215} cy={235} r={13} fill={fill(on, p)} stroke={stroke(on, p)} strokeWidth={2} />
            <text x={215} y={239} textAnchor="middle" className="ds-label ds-label-sm">
              L3
            </text>
          </>
        ),
      })}

      {/* Palanca derecha */}
      <circle cx={385} cy={235} r={44} fill="var(--ds-well)" />
      {Btn({
        id: 'R3',
        children: (on, p) => (
          <>
            <circle cx={385} cy={235} r={30} fill={fill(on, p)} stroke={stroke(on, p)} strokeWidth={2} />
            <text x={385} y={240} textAnchor="middle" className="ds-label">
              R3
            </text>
          </>
        ),
      })}
    </svg>
  )
}
