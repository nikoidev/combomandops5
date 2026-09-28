import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uid, type Combo, type Locale, type Step } from '../lib/types'

type State = {
  combos: Combo[]
  locale: Locale
  selectedClass: string | null
  selectedCombo: string | null
  setLocale: (l: Locale) => void
  selectClass: (slug: string | null) => void
  selectCombo: (id: string | null) => void
  createCombo: (classSlug: string, name: string) => string
  addCombos: (combos: Combo[]) => void
  renameCombo: (id: string, name: string) => void
  duplicateCombo: (id: string) => string | null
  deleteCombo: (id: string) => void
  addStep: (comboId: string, step: Omit<Step, 'id'>, at?: number) => void
  updateStep: (comboId: string, stepId: string, patch: Partial<Omit<Step, 'id'>>) => void
  removeStep: (comboId: string, stepId: string) => void
  duplicateStep: (comboId: string, stepId: string) => void
  moveStep: (comboId: string, from: number, to: number) => void
}

const detectLocale = (): Locale =>
  typeof navigator !== 'undefined' && /^es-(ES|AD)$/i.test(navigator.language) ? 'es-ES' : 'es-419'

export const useCombos = create<State>()(
  persist(
    (set, get) => {
      const patchCombo = (id: string, fn: (c: Combo) => Combo) =>
        set((s) => ({ combos: s.combos.map((c) => (c.id === id ? { ...fn(c), updatedAt: Date.now() } : c)) }))

      return {
        combos: [],
        locale: detectLocale(),
        selectedClass: null,
        selectedCombo: null,
        setLocale: (locale) => set({ locale }),
        selectClass: (selectedClass) => set({ selectedClass, selectedCombo: null }),
        selectCombo: (selectedCombo) => set({ selectedCombo }),
        createCombo: (classSlug, name) => {
          const now = Date.now()
          const combo: Combo = { id: uid(), classSlug, name, steps: [], createdAt: now, updatedAt: now }
          set((s) => ({ combos: [...s.combos, combo], selectedCombo: combo.id }))
          return combo.id
        },
        addCombos: (combos) => set((s) => ({ combos: [...s.combos, ...combos] })),
        renameCombo: (id, name) => patchCombo(id, (c) => ({ ...c, name })),
        duplicateCombo: (id) => {
          const src = get().combos.find((c) => c.id === id)
          if (!src) return null
          const now = Date.now()
          const copy: Combo = {
            ...src,
            id: uid(),
            name: `${src.name} (copia)`,
            steps: src.steps.map((s) => ({ ...s, id: uid() })),
            createdAt: now,
            updatedAt: now,
          }
          set((s) => ({ combos: [...s.combos, copy], selectedCombo: copy.id }))
          return copy.id
        },
        deleteCombo: (id) =>
          set((s) => ({
            combos: s.combos.filter((c) => c.id !== id),
            selectedCombo: s.selectedCombo === id ? null : s.selectedCombo,
          })),
        addStep: (comboId, step, at) =>
          patchCombo(comboId, (c) => {
            const steps = [...c.steps]
            steps.splice(at ?? steps.length, 0, { ...step, id: uid() })
            return { ...c, steps }
          }),
        updateStep: (comboId, stepId, patch) =>
          patchCombo(comboId, (c) => ({ ...c, steps: c.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) })),
        removeStep: (comboId, stepId) =>
          patchCombo(comboId, (c) => ({ ...c, steps: c.steps.filter((s) => s.id !== stepId) })),
        duplicateStep: (comboId, stepId) =>
          patchCombo(comboId, (c) => {
            const i = c.steps.findIndex((s) => s.id === stepId)
            if (i < 0) return c
            const steps = [...c.steps]
            steps.splice(i + 1, 0, { ...c.steps[i], id: uid() })
            return { ...c, steps }
          }),
        moveStep: (comboId, from, to) =>
          patchCombo(comboId, (c) => {
            const steps = [...c.steps]
            const [item] = steps.splice(from, 1)
            if (!item) return c
            steps.splice(to, 0, item)
            return { ...c, steps }
          }),
      }
    },
    { name: 'combomandops5', version: 1 },
  ),
)
