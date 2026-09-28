import classesJson from '../data/classes.json'
import type { BdoClass, Skill } from './types'

export const CLASSES = classesJson as BdoClass[]

const loaders = import.meta.glob<{ default: Skill[] }>('../data/skills/*.json')
const cache = new Map<string, Promise<Skill[]>>()

/** Carga perezosa de las habilidades de una clase (un chunk por clase) */
export function loadSkills(slug: string): Promise<Skill[]> {
  let p = cache.get(slug)
  if (!p) {
    const loader = loaders[`../data/skills/${slug}.json`]
    p = loader ? loader().then((m) => m.default) : Promise.resolve([])
    cache.set(slug, p)
  }
  return p
}

export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`

/** Para búsquedas: minúsculas y sin tildes */
export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
