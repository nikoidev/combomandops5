export const PS_BUTTONS = [
  'cross',
  'circle',
  'square',
  'triangle',
  'L1',
  'R1',
  'L2',
  'R2',
  'L3',
  'R3',
  'up',
  'down',
  'left',
  'right',
  'LS_fwd',
  'LS_back',
  'LS_left',
  'LS_right',
  'options',
  'touchpad',
] as const

export type PsButton = (typeof PS_BUTTONS)[number]

export type Step = {
  id: string
  /** Botones que se pulsan a la vez, p. ej. ['L2', 'square'] */
  buttons: PsButton[]
  skillId?: number
  /** Mantener pulsado */
  hold?: boolean
  note?: string
}

export type Combo = {
  id: string
  classSlug: string
  name: string
  steps: Step[]
  createdAt: number
  updatedAt: number
}

export type LocalizedName = { esES: string; es419: string; en: string }

export type BdoClass = {
  slug: string
  name: LocalizedName
  icon: string | null
  skillCount: number
}

export type Skill = {
  id: number
  name: LocalizedName
  icon: string
  level: number
  combat: boolean
}

export type Locale = 'es-419' | 'es-ES'

export const nameKey = (locale: Locale): 'es419' | 'esES' => (locale === 'es-419' ? 'es419' : 'esES')

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
