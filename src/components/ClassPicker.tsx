import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CLASSES, fold } from '../lib/data'
import { nameKey } from '../lib/types'
import { useCombos } from '../store/combos'
import { SkillIcon } from './SkillIcon'

export function ClassPicker() {
  const { t } = useTranslation()
  const { locale, combos, selectClass } = useCombos()
  const key = nameKey(locale)
  const [query, setQuery] = useState('')

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    combos.forEach((c) => m.set(c.classSlug, (m.get(c.classSlug) ?? 0) + 1))
    return m
  }, [combos])

  const list = useMemo(() => {
    const q = fold(query.trim())
    return CLASSES.filter((c) => !q || fold(`${c.name.esES} ${c.name.es419} ${c.name.en}`).includes(q)).sort((a, b) =>
      a.name[key].localeCompare(b.name[key], 'es'),
    )
  }, [query, key])

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-semibold">{t('classes.title')}</h2>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('classes.search')}
          className="input w-full sm:w-64"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {list.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => selectClass(c.slug)}
            className="card flex items-center gap-3 p-3 text-left transition hover:border-accent/60 hover:bg-panel-2"
          >
            <SkillIcon src={c.icon} alt={c.name[key]} size={44} />
            <span className="min-w-0">
              <span className="block truncate font-medium">{c.name[key]}</span>
              <span className="block truncate text-xs text-muted">
                {counts.get(c.slug)
                  ? t('classes.combos', { count: counts.get(c.slug) })
                  : t('classes.skills', { count: c.skillCount })}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
