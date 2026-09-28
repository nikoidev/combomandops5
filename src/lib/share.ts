import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { PS_BUTTONS, uid, type Combo, type PsButton, type Step } from './types'

const VALID = new Set<string>(PS_BUTTONS)

/** Valida y normaliza un combo que viene de fuera (archivo o enlace) */
export function sanitizeCombo(raw: unknown): Combo | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Partial<Combo>
  if (typeof c.classSlug !== 'string' || !Array.isArray(c.steps)) return null
  const steps: Step[] = c.steps
    .filter((s): s is Step => !!s && Array.isArray((s as Step).buttons))
    .map((s) => ({
      id: uid(),
      buttons: s.buttons.filter((b): b is PsButton => VALID.has(b)),
      ...(typeof s.skillId === 'number' ? { skillId: s.skillId } : {}),
      ...(s.hold ? { hold: true } : {}),
      ...(typeof s.note === 'string' && s.note ? { note: s.note.slice(0, 200) } : {}),
    }))
  const now = Date.now()
  return {
    id: uid(),
    classSlug: c.classSlug,
    name: typeof c.name === 'string' && c.name.trim() ? c.name.slice(0, 80) : 'Combo',
    steps,
    createdAt: now,
    updatedAt: now,
  }
}

type Portable = Pick<Combo, 'classSlug' | 'name'> & { steps: Omit<Step, 'id'>[] }

const portable = (c: Combo): Portable => ({
  classSlug: c.classSlug,
  name: c.name,
  steps: c.steps.map(({ id: _id, ...s }) => s),
})

export const encodeCombo = (c: Combo) => compressToEncodedURIComponent(JSON.stringify(portable(c)))

export function decodeCombo(code: string): Combo | null {
  try {
    return sanitizeCombo(JSON.parse(decompressFromEncodedURIComponent(code) ?? ''))
  } catch {
    return null
  }
}

export const shareUrl = (c: Combo) => `${location.origin}${location.pathname}#c=${encodeCombo(c)}`

export const exportFile = (combos: Combo[]) =>
  JSON.stringify({ app: 'combomandops5', version: 1, combos: combos.map(portable) }, null, 2)

export function importFile(text: string): Combo[] {
  const data = JSON.parse(text)
  const list: unknown[] = Array.isArray(data) ? data : Array.isArray(data?.combos) ? data.combos : [data]
  return list.map(sanitizeCombo).filter((c): c is Combo => c !== null)
}
