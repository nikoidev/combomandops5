import { readPressed, sortButtons } from './buttons'
import { initialPractice, stepPractice } from './practice'
import { decodeCombo, encodeCombo, exportFile, importFile, sanitizeCombo } from './share'
import type { Combo, PsButton } from './types'

const set = (...b: PsButton[]) => new Set(b)

const combo: Combo = {
  id: 'x',
  classSlug: 'warrior',
  name: 'Apertura',
  steps: [
    { id: 'a', buttons: ['LS_fwd', 'square'], skillId: 1744 },
    { id: 'b', buttons: ['L2', 'triangle'], hold: true, note: 'cancelar' },
  ],
  createdAt: 0,
  updatedAt: 0,
}

describe('buttons', () => {
  it('ordena modificadores antes que botones de acción y quita duplicados', () => {
    expect(sortButtons(['square', 'L2', 'LS_fwd', 'square'])).toEqual(['L2', 'LS_fwd', 'square'])
  })

  it('lee el mapeo estándar del DualSense y el stick izquierdo', () => {
    const buttons = Array.from({ length: 18 }, (_, i) => ({ pressed: i === 2 || i === 6 }))
    expect(readPressed(buttons, [0.1, -0.9])).toEqual(set('square', 'L2', 'LS_fwd'))
    expect(readPressed(buttons.map(() => ({ pressed: false })), [0.9, 0.2])).toEqual(set('LS_right'))
  })

  it('cuenta los gatillos analógicos pulsados a medias', () => {
    const buttons = Array.from({ length: 18 }, (_, i) => ({ pressed: false, value: i === 7 ? 0.8 : 0 }))
    expect(readPressed(buttons, [])).toEqual(set('R2'))
  })
})

describe('practice', () => {
  it('completa un paso al pulsar todos sus botones a la vez', () => {
    let s = initialPractice()
    s = stepPractice(s, ['L2', 'square'], set('L2'), set('L2'))
    expect(s.index).toBe(0)
    s = stepPractice(s, ['L2', 'square'], set('L2', 'square'), set('square'))
    expect(s.index).toBe(1)
    expect(s.lastResult).toBe('ok')
  })

  it('marca fallo con un botón equivocado pero no con el stick', () => {
    let s = initialPractice()
    s = stepPractice(s, ['square'], set('LS_fwd'), set('LS_fwd'))
    expect(s.mistakes).toBe(0)
    s = stepPractice(s, ['square'], set('circle'), set('circle'))
    expect(s.mistakes).toBe(1)
    expect(s.index).toBe(0)
  })

  it('exige volver a pulsar si dos pasos seguidos son iguales', () => {
    let s = stepPractice(initialPractice(), ['square'], set('square'), set('square'))
    expect(s.index).toBe(1)
    // Se mantiene pulsado: no avanza
    s = stepPractice(s, ['square'], set('square'), set())
    expect(s.index).toBe(1)
    s = stepPractice(s, ['square'], set('square'), set('square'))
    expect(s.index).toBe(2)
  })

  it('no cambia el estado en fotogramas sin novedades', () => {
    const s = initialPractice()
    expect(stepPractice(s, ['square'], set(), set())).toBe(s)
  })
})

describe('share', () => {
  it('codifica y decodifica un combo por URL', () => {
    const back = decodeCombo(encodeCombo(combo))!
    expect(back.name).toBe('Apertura')
    expect(back.classSlug).toBe('warrior')
    expect(back.steps.map(({ id: _id, ...s }) => s)).toEqual(combo.steps.map(({ id: _id, ...s }) => s))
    expect(back.id).not.toBe(combo.id)
  })

  it('rechaza códigos corruptos', () => {
    expect(decodeCombo('basura')).toBeNull()
  })

  it('exporta e importa archivos JSON', () => {
    const imported = importFile(exportFile([combo, combo]))
    expect(imported).toHaveLength(2)
    expect(imported[0].steps[1]).toMatchObject({ buttons: ['L2', 'triangle'], hold: true, note: 'cancelar' })
  })

  it('filtra botones desconocidos al sanear', () => {
    const c = sanitizeCombo({ classSlug: 'nova', name: '', steps: [{ buttons: ['square', 'turbo'] }] })!
    expect(c.steps[0].buttons).toEqual(['square'])
    expect(c.name).toBe('Combo')
    expect(sanitizeCombo({ name: 'sin clase' })).toBeNull()
  })
})
