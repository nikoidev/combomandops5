import { useCombos } from './combos'

const store = () => useCombos.getState()

beforeEach(() => {
  localStorage.clear()
  useCombos.setState({ combos: [], selectedClass: null, selectedCombo: null })
})

describe('store de combos', () => {
  it('crea, añade pasos y reordena', () => {
    const id = store().createCombo('warrior', 'Mi combo')
    store().addStep(id, { buttons: ['square'] })
    store().addStep(id, { buttons: ['triangle'] })
    store().addStep(id, { buttons: ['circle'] })
    store().moveStep(id, 2, 0)
    const combo = store().combos.find((c) => c.id === id)!
    expect(combo.steps.map((s) => s.buttons[0])).toEqual(['circle', 'square', 'triangle'])
    expect(store().selectedCombo).toBe(id)
  })

  it('duplica pasos y combos con ids nuevos', () => {
    const id = store().createCombo('nova', 'A')
    store().addStep(id, { buttons: ['L1'] })
    const stepId = store().combos[0].steps[0].id
    store().duplicateStep(id, stepId)
    const copyId = store().duplicateCombo(id)!
    const copy = store().combos.find((c) => c.id === copyId)!
    expect(copy.name).toBe('A (copia)')
    expect(copy.steps).toHaveLength(2)
    expect(new Set([...store().combos.flatMap((c) => c.steps.map((s) => s.id))]).size).toBe(4)
  })

  it('edita y borra', () => {
    const id = store().createCombo('nova', 'A')
    store().addStep(id, { buttons: ['L1'], note: 'x' })
    const stepId = store().combos[0].steps[0].id
    store().updateStep(id, stepId, { buttons: ['R1'], note: undefined })
    expect(store().combos[0].steps[0]).toMatchObject({ buttons: ['R1'] })
    store().removeStep(id, stepId)
    expect(store().combos[0].steps).toHaveLength(0)
    store().deleteCombo(id)
    expect(store().combos).toHaveLength(0)
    expect(store().selectedCombo).toBeNull()
  })

  it('persiste en localStorage', () => {
    store().createCombo('warrior', 'Guardado')
    expect(localStorage.getItem('combomandops5')).toContain('Guardado')
  })
})
