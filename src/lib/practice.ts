import { DIRECTIONS } from './buttons'
import type { PsButton } from './types'

export type PracticeState = {
  index: number
  /** Botones pulsados (flanco de subida) desde que empezó el paso actual */
  fresh: Set<PsButton>
  mistakes: number
  lastResult: 'ok' | 'miss' | null
}

export const initialPractice = (): PracticeState => ({ index: 0, fresh: new Set(), mistakes: 0, lastResult: null })

/**
 * Avanza la práctica con un nuevo fotograma de entrada.
 * Un paso se completa cuando todos sus botones están pulsados a la vez y al menos uno se ha pulsado de nuevo
 * durante este paso (así dos pasos iguales seguidos exigen soltar y volver a pulsar).
 * Pulsar un botón que no pertenece al paso cuenta como fallo (las direcciones del stick no penalizan).
 */
export function stepPractice(
  state: PracticeState,
  required: PsButton[],
  pressed: Set<PsButton>,
  justPressed: Set<PsButton>,
): PracticeState {
  if (required.length === 0) return { ...state, index: state.index + 1, fresh: new Set(), lastResult: 'ok' }
  const fresh = new Set([...state.fresh, ...justPressed])
  const req = new Set(required)
  const wrong = [...justPressed].some((b) => !req.has(b) && !DIRECTIONS.includes(b))
  if (wrong) return { ...state, fresh: new Set(), mistakes: state.mistakes + 1, lastResult: 'miss' }
  const complete = required.every((b) => pressed.has(b)) && required.some((b) => fresh.has(b))
  if (complete) return { ...state, index: state.index + 1, fresh: new Set(), lastResult: 'ok' }
  return justPressed.size ? { ...state, fresh } : state
}
