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

// Formas tomadas de una foto frontal del DualSense (viewBox 600×468)
// Carcasa blanca: hombros redondeados y agarres largos
const SHELL =
  'M300 48H410C460 44 505 50 530 70C560 95 576 140 578 190C580 250 574 320 562 380C554 420 542 440 520 442C500 444 484 436 476 420C464 380 450 320 425 290C400 280 350 280 300 280C250 280 200 280 175 290C150 320 136 380 124 420C116 436 100 444 80 442C58 440 46 420 38 380C26 320 20 250 22 190C24 140 40 95 70 70C95 50 140 44 190 48Z'
// Núcleo negro: bajo el panel táctil, alrededor de los sticks y por el interior de los agarres
const CORE =
  'M206 120C196 150 178 172 170 205C164 245 150 300 130 360C122 384 117 402 118 420L124 420C136 380 150 320 175 290C200 280 250 280 300 280C350 280 400 280 425 290C450 320 464 380 476 420L482 420C483 402 478 384 470 360C450 300 436 245 430 205C422 172 404 150 394 120Z'
// Panel táctil: trapecio grande pegado al borde superior
const TOUCHPAD = 'M192 46H408L391 138Q388 152 374 152H226Q212 152 209 138Z'
// Barra de luz en U alrededor del panel
const LIGHTBAR = 'M198 60L210 140Q214 158 232 158H368Q386 158 390 140L402 60'
// Gatillo L2 (R2 se dibuja en espejo)
const TRIGGER_L = 'M76 64C82 34 108 14 145 14H180C194 14 201 24 199 38L195 62Z'

const DPAD = { x: 138, y: 128 }
const FACE = { x: 462, y: 128 }
const LSTICK = { x: 225, y: 208 }
const RSTICK = { x: 375, y: 208 }

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

  const trigger = (id: PsButton, mirror: boolean) =>
    Btn({
      id,
      children: (on, p) => (
        <>
          <path d={TRIGGER_L} transform={mirror ? 'translate(600 -30) scale(-1 1)' : 'translate(0 -30)'} fill={fill(on, p)} stroke={stroke(on, p)} strokeWidth={2} />
          <text x={mirror ? 460 : 140} y={10} textAnchor="middle" className="ds-label">
            {id}
          </text>
        </>
      ),
    })

  const bumper = (id: PsButton, x: number) =>
    Btn({
      id,
      children: (on, p) => (
        <>
          <rect x={x} y={28} width={106} height={18} rx={8.5} fill={fill(on, p)} stroke={stroke(on, p)} strokeWidth={2} />
          <text x={x + 53} y={41.5} textAnchor="middle" className="ds-label ds-label-sm">
            {id}
          </text>
        </>
      ),
    })

  // Cruceta: cuatro teclas separadas que apuntan al centro, con flecha triangular
  const dpad = (id: PsButton, rot: number) =>
    Btn({
      id,
      children: (on, p) => (
        <g transform={`translate(${DPAD.x} ${DPAD.y}) rotate(${rot})`}>
          <path
            d="M-10 -43H10Q15 -43 15 -38V-24Q15 -21 12 -19L3 -12Q0 -10 -3 -12L-12 -19Q-15 -21 -15 -24V-38Q-15 -43 -10 -43Z"
            fill={fill(on, p)}
            stroke={stroke(on, p)}
            strokeWidth={2}
          />
          <path d="M0 -36L5 -28H-5Z" fill="var(--ds-glyph)" />
        </g>
      ),
    })

  const face = (id: PsButton, dx: number, dy: number, shape: ReactNode) =>
    Btn({
      id,
      children: (on, p) => (
        <>
          <circle cx={FACE.x + dx} cy={FACE.y + dy} r={17} fill={fill(on, p)} stroke={stroke(on, p)} strokeWidth={2} />
          <g
            transform={`translate(${FACE.x + dx - 12} ${FACE.y + dy - 12})`}
            stroke={on || p ? FACE_COLORS[id] : 'var(--ds-glyph)'}
            strokeWidth={on || p ? 2.6 : 1.6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {shape}
          </g>
        </>
      ),
    })

  // Stick izquierdo: cuatro direcciones alrededor + L3 al pulsar el centro
  const stickDir = (id: PsButton, rot: number) =>
    Btn({
      id,
      children: (on, p) => (
        <path
          transform={`translate(${LSTICK.x} ${LSTICK.y}) rotate(${rot})`}
          d="M-27 -32A42 42 0 0 1 27 -32L14 -17A22 22 0 0 0 -14 -17Z"
          fill={fill(on, p)}
          stroke={stroke(on, p)}
          strokeWidth={2}
        />
      ),
    })

  return (
    <svg viewBox="0 -18 600 468" className="h-auto w-full select-none" role="group" aria-label="DualSense">
      <defs>
        <filter id="ds-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <linearGradient id="ds-shell-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--ds-shell)" />
          <stop offset="1" stopColor="var(--ds-shell-shade)" />
        </linearGradient>
      </defs>

      {trigger('L2', false)}
      {trigger('R2', true)}
      <path d={SHELL} fill="url(#ds-shell-grad)" stroke="var(--ds-shell-stroke)" strokeWidth={2.5} />
      <path d={CORE} fill="var(--ds-plate)" stroke="var(--ds-plate-stroke)" strokeWidth={1.5} />

      {/* L1/R1 sobre el borde del hombro */}
      {bumper('L1', 90)}
      {bumper('R1', 404)}

      {/* Barra de luz: se dibuja bajo el panel para que asome por los bordes */}
      <g aria-hidden pointerEvents="none">
        <path d={LIGHTBAR} fill="none" stroke="var(--ds-lightbar)" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" filter="url(#ds-glow)" />
        <path d={LIGHTBAR} fill="none" stroke="var(--ds-lightbar-core)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {Btn({
        id: 'touchpad',
        children: (on, p) => (
          <path d={TOUCHPAD} fill={on || p ? fill(on, p) : 'var(--ds-shell)'} stroke={on || p ? stroke(on, p) : 'var(--ds-shell-stroke)'} strokeWidth={1.5} />
        ),
      })}

      {/* Create (decorativo) y Options, fuera de las esquinas del panel */}
      <g aria-hidden>
        <path d="M176 50l-2 -6M181 49v-6M186 50l2 -6" stroke="var(--ds-shell-stroke)" strokeWidth={1.4} strokeLinecap="round" />
        <rect x={174} y={58} width={13} height={24} rx={6.5} transform="rotate(-10 180 70)" fill="var(--ds-shell)" stroke="var(--ds-shell-stroke)" strokeWidth={1.5} />
        <path d="M414 45h12M414 49h12M414 53h12" stroke="var(--ds-shell-stroke)" strokeWidth={1.4} strokeLinecap="round" />
      </g>
      {Btn({
        id: 'options',
        children: (on, p) => (
          <rect
            x={413}
            y={58}
            width={13}
            height={24}
            rx={6.5}
            transform="rotate(10 420 70)"
            fill={on || p ? fill(on, p) : 'var(--ds-shell)'}
            stroke={on || p ? stroke(on, p) : 'var(--ds-shell-stroke)'}
            strokeWidth={1.5}
          />
        ),
      })}

      {dpad('up', 0)}
      {dpad('right', 90)}
      {dpad('down', 180)}
      {dpad('left', 270)}

      {face('triangle', 0, -38, <path d="M12 5.5l6.5 11h-13z" />)}
      {face('circle', 38, 0, <circle cx="12" cy="12" r="6.5" />)}
      {face('cross', 0, 38, <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />)}
      {face('square', -38, 0, <rect x="6" y="6" width="12" height="12" rx="0.5" />)}

      {/* Stick izquierdo */}
      <circle cx={LSTICK.x} cy={LSTICK.y} r={46} fill="var(--ds-well)" />
      {stickDir('LS_fwd', 0)}
      {stickDir('LS_right', 90)}
      {stickDir('LS_back', 180)}
      {stickDir('LS_left', 270)}
      {Btn({
        id: 'L3',
        children: (on, p) => (
          <>
            <circle cx={LSTICK.x} cy={LSTICK.y} r={14} fill={fill(on, p)} stroke={stroke(on, p)} strokeWidth={2} />
            <text x={LSTICK.x} y={LSTICK.y + 4} textAnchor="middle" className="ds-label ds-label-sm">
              L3
            </text>
          </>
        ),
      })}

      {/* Stick derecho con capuchón texturizado */}
      <circle cx={RSTICK.x} cy={RSTICK.y} r={46} fill="var(--ds-well)" />
      {Btn({
        id: 'R3',
        children: (on, p) => (
          <>
            <circle cx={RSTICK.x} cy={RSTICK.y} r={34} fill={fill(on, p)} stroke={stroke(on, p)} strokeWidth={2} />
            <circle cx={RSTICK.x} cy={RSTICK.y} r={27} fill="none" stroke="var(--ds-key-stroke)" strokeWidth={4} strokeDasharray="1.5 2.5" />
            <text x={RSTICK.x} y={RSTICK.y + 5} textAnchor="middle" className="ds-label">
              R3
            </text>
          </>
        ),
      })}

      {/* Altavoz, logo PS, botón de silencio y micrófono (decorativos) */}
      <g aria-hidden fill="var(--ds-key-stroke)">
        {[0, 1].map((row) =>
          [-2, -1, 0, 1, 2].map((col) => <circle key={`${row}${col}`} cx={300 + col * 7} cy={176 + row * 7} r={2.2} />),
        )}
        <path d="M294 218V200H301Q308 200 308 206Q308 212 301 212H298" fill="none" stroke="var(--ds-glyph)" strokeWidth={2} strokeLinejoin="round" />
        <path d="M286 216Q300 222 314 214" fill="none" stroke="var(--ds-glyph)" strokeWidth={1.6} strokeLinecap="round" />
        <rect x={289} y={234} width={22} height={7} rx={3.5} fill="var(--ds-shell-shade)" />
        <circle cx={300} cy={256} r={1.6} />
      </g>
    </svg>
  )
}
