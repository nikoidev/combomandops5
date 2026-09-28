import type { PsButton } from './types'

/** Orden canónico al mostrar un paso: gatillos/modificadores primero, luego dirección y botón de acción */
const ORDER: PsButton[] = [
  'L1',
  'R1',
  'L2',
  'R2',
  'LS_fwd',
  'LS_back',
  'LS_left',
  'LS_right',
  'up',
  'down',
  'left',
  'right',
  'L3',
  'R3',
  'square',
  'triangle',
  'circle',
  'cross',
  'options',
  'touchpad',
]

export const sortButtons = (buttons: PsButton[]) =>
  [...new Set(buttons)].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))

export const DIRECTIONS: PsButton[] = ['LS_fwd', 'LS_back', 'LS_left', 'LS_right']

/**
 * Índices del mapeo "standard" de la Gamepad API (DualSense por USB/Bluetooth en Chrome/Edge/Firefox).
 * https://w3c.github.io/gamepad/#remapping
 */
export const GAMEPAD_INDEX: Partial<Record<number, PsButton>> = {
  0: 'cross',
  1: 'circle',
  2: 'square',
  3: 'triangle',
  4: 'L1',
  5: 'R1',
  6: 'L2',
  7: 'R2',
  9: 'options',
  10: 'L3',
  11: 'R3',
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
  17: 'touchpad',
}

export const STICK_THRESHOLD = 0.5

/** Convierte el estado crudo del mando en el conjunto de botones pulsados */
export function readPressed(
  buttons: ReadonlyArray<{ pressed: boolean; value?: number }>,
  axes: ReadonlyArray<number>,
): Set<PsButton> {
  const out = new Set<PsButton>()
  buttons.forEach((b, i) => {
    const name = GAMEPAD_INDEX[i]
    if (name && (b.pressed || (b.value ?? 0) > 0.5)) out.add(name)
  })
  const [x = 0, y = 0] = axes
  if (y < -STICK_THRESHOLD) out.add('LS_fwd')
  if (y > STICK_THRESHOLD) out.add('LS_back')
  if (x < -STICK_THRESHOLD) out.add('LS_left')
  if (x > STICK_THRESHOLD) out.add('LS_right')
  return out
}

/** Atajos de teclado para probar sin mando */
export const KEYBOARD: Record<string, PsButton> = {
  j: 'square',
  i: 'triangle',
  l: 'circle',
  k: 'cross',
  q: 'L1',
  e: 'R1',
  shift: 'L2',
  r: 'R2',
  w: 'LS_fwd',
  s: 'LS_back',
  a: 'LS_left',
  d: 'LS_right',
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  f: 'L3',
  g: 'R3',
}

/** Colores de los botones frontales */
export const FACE_COLORS: Partial<Record<PsButton, string>> = {
  cross: '#7aa2ff',
  circle: '#ff6b6b',
  square: '#f08cd0',
  triangle: '#4fd1a5',
}
