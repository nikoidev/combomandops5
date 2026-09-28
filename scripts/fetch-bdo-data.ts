/**
 * Descarga clases, habilidades (es-ES, es-419 y en) e iconos desde bdocodex.com.
 *
 *   npm run fetch:data            # usa caché de JSON si existe
 *   npm run fetch:data -- --fresh # vuelve a pedir los JSON
 *
 * Genera:
 *   src/data/classes.json
 *   src/data/skills/<slug>.json
 *   public/icons/bdo/**.webp
 *
 * Nombres e iconos © Pearl Abyss. Datos obtenidos de bdocodex.com.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { Skill } from '../src/lib/types.ts'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, 'scripts', '.cache')
const DATA = join(ROOT, 'src', 'data')
const ICONS = join(ROOT, 'public', 'icons', 'bdo')
const BASE = 'https://bdocodex.com'
const UA = 'Mozilla/5.0 (combomandops5 data fetcher; personal fan project)'
const FRESH = process.argv.includes('--fresh')

// Idiomas de bdocodex: es = España, sp = Latinoamérica, us = inglés
const LANGS = { esES: 'es', es419: 'sp', en: 'us' } as const
type LangKey = keyof typeof LANGS
type Names = Record<LangKey, string>

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function exists(p: string) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function get(url: string, referer: string, attempt = 1): Promise<Response> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: referer } })
  if (!res.ok) {
    if (attempt >= 4) throw new Error(`${res.status} ${url}`)
    await sleep(1000 * attempt)
    return get(url, referer, attempt + 1)
  }
  return res
}

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()

const ROMAN = /\s+(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)$/
const baseName = (s: string) => s.replace(ROMAN, '').trim()

async function fetchClassList(lang: string): Promise<Map<string, string>> {
  const html = await (await get(`${BASE}/${lang}/skills/`, BASE)).text()
  const map = new Map<string, string>()
  const re = new RegExp(`<a href="/${lang}/skills/([a-z]+)/" class="dropdown-item">([^<]*)</a>`, 'g')
  for (const m of html.matchAll(re)) map.set(m[1], decode(m[2]))
  return map
}

type Row = [number, string, string, number, string, number]

async function fetchSkills(slug: string, lang: string): Promise<Row[]> {
  const cacheFile = join(CACHE, `${slug}.${lang}.json`)
  if (!FRESH && (await exists(cacheFile))) return JSON.parse(await readFile(cacheFile, 'utf8'))
  const url = `${BASE}/query.php?a=skills&type=${slug}&l=${lang}`
  const text = (await (await get(url, `${BASE}/${lang}/skills/${slug}/`)).text()).replace(/^﻿/, '')
  const rows = JSON.parse(text).aaData as Row[]
  await writeFile(cacheFile, JSON.stringify(rows))
  await sleep(700)
  return rows
}

// Habilidades con flag 0 en bdocodex que sí se usan en combos
const COMBAT_PREFIX = /^(Core|Succession|Chain|Flow|Awakening|Absolute|Prime):/i
// Cosas que no interesan para combos
const SKIP = /^(Black Spirit|Guild|PEN|TET|TRI|DUO|PRI)\b|Fitness Training|Weight Training|Make Bonfire|Revive Target|Flute Buff|Cannon Attack|Blessing of|Fury of Asadal|Muscle Training/i


function iconPath(iconHtml: string) {
  const m = iconHtml.match(/src="([^"]+)"/)
  return m ? m[1].replace(/\\\//g, '/') : null
}

async function main() {
  await mkdir(CACHE, { recursive: true })
  await mkdir(join(DATA, 'skills'), { recursive: true })

  const classLists = {} as Record<LangKey, Map<string, string>>
  for (const [key, lang] of Object.entries(LANGS) as [LangKey, string][]) {
    classLists[key] = await fetchClassList(lang)
  }
  const slugs = [...classLists.esES.keys()].sort()
  console.log(`${slugs.length} clases`)

  const icons = new Set<string>()
  const classes: { slug: string; name: Names; icon: string | null; skillCount: number }[] = []
  const skillsByClass = new Map<string, Skill[]>()

  for (const slug of slugs) {
    const byLang = {} as Record<LangKey, Map<number, Row>>
    for (const [key, lang] of Object.entries(LANGS) as [LangKey, string][]) {
      byLang[key] = new Map((await fetchSkills(slug, lang)).map((r) => [r[0], r]))
    }

    // Agrupar rangos (I, II, III…) por nombre base en inglés; conservar el rango más alto
    const groups = new Map<string, Row>()
    for (const row of byLang.esES.values()) {
      const en = decode(byLang.en.get(row[0])?.[2] ?? row[2])
      if (row[3] <= 0 || SKIP.test(en)) continue
      const key = baseName(en)
      const prev = groups.get(key)
      if (!prev || row[3] > prev[3] || (row[3] === prev[3] && row[0] > prev[0])) groups.set(key, row)
    }

    const skills: Skill[] = []
    for (const row of groups.values()) {
      const icon = iconPath(row[1])
      if (!icon) continue
      const name = {} as Names
      for (const key of Object.keys(LANGS) as LangKey[]) {
        name[key] = baseName(decode(byLang[key].get(row[0])?.[2] ?? row[2]))
      }
      const local = icon.replace(/^\/items\/new_icon\//, '')
      icons.add(local)
      skills.push({
        id: row[0],
        name,
        icon: `icons/bdo/${local}`,
        level: row[3],
        combat: row[5] === 1 || COMBAT_PREFIX.test(name.en),
      })
    }
    skills.sort((a, b) => Number(b.combat) - Number(a.combat) || a.name.esES.localeCompare(b.name.esES, 'es'))

    skillsByClass.set(slug, skills)
    classes.push({
      slug,
      name: {
        esES: classLists.esES.get(slug) ?? slug,
        es419: classLists.es419.get(slug) ?? classLists.esES.get(slug) ?? slug,
        en: classLists.en.get(slug) ?? slug,
      },
      icon: null,
      skillCount: skills.filter((s) => s.combat).length,
    })
    await writeFile(join(DATA, 'skills', `${slug}.json`), JSON.stringify(skills, null, 1) + '\n')
    console.log(`  ${slug}: ${skills.length} habilidades (${skills.filter((s) => s.combat).length} de combate)`)
  }

  // Icono de clase: habilidad de combate de mayor nivel cuyo icono no compartan otras clases
  const iconUse = new Map<string, number>()
  for (const list of skillsByClass.values()) {
    for (const icon of new Set(list.map((s) => s.icon))) iconUse.set(icon, (iconUse.get(icon) ?? 0) + 1)
  }
  for (const c of classes) {
    const own = (skillsByClass.get(c.slug) ?? []).filter((s) => s.combat && iconUse.get(s.icon) === 1)
    c.icon = own.sort((a, b) => b.level - a.level || b.id - a.id)[0]?.icon ?? null
  }

  classes.sort((a, b) => a.name.esES.localeCompare(b.name.esES, 'es'))
  await writeFile(join(DATA, 'classes.json'), JSON.stringify(classes, null, 1) + '\n')

  // Iconos, con concurrencia baja para no saturar el sitio
  const pending: string[] = []
  for (const rel of icons) {
    if (!(await exists(join(ICONS, rel)))) pending.push(rel)
  }
  console.log(`${icons.size} iconos, ${pending.length} por descargar`)
  let done = 0
  const worker = async () => {
    while (pending.length) {
      const rel = pending.shift()!
      try {
        const res = await get(`${BASE}/items/new_icon/${rel}`, `${BASE}/es/skills/`)
        const file = join(ICONS, rel)
        await mkdir(dirname(file), { recursive: true })
        await writeFile(file, Buffer.from(await res.arrayBuffer()))
      } catch (e) {
        console.warn(`  ✗ ${rel}: ${(e as Error).message}`)
      }
      if (++done % 200 === 0) console.log(`  ${done} iconos…`)
      await sleep(150)
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  console.log('Listo.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
