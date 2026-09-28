import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fold } from '../lib/data'
import { nameKey, type Skill } from '../lib/types'
import { useCombos } from '../store/combos'
import { SkillIcon } from './SkillIcon'

type Props = {
  skills: Skill[] | null
  selectedId?: number
  onSelect: (skill: Skill | null) => void
}

export function SkillPicker({ skills, selectedId, onSelect }: Props) {
  const { t } = useTranslation()
  const locale = useCombos((s) => s.locale)
  const key = nameKey(locale)
  const [query, setQuery] = useState('')
  const [onlyCombat, setOnlyCombat] = useState(true)

  const filtered = useMemo(() => {
    if (!skills) return []
    const q = fold(query.trim())
    return skills
      .filter((s) => !onlyCombat || s.combat)
      .filter((s) => !q || fold(`${s.name[key]} ${s.name.en}`).includes(q))
      .sort((a, b) => a.name[key].localeCompare(b.name[key], 'es'))
  }, [skills, query, onlyCombat, key])

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('skills.search')}
          className="input min-w-0 flex-1"
        />
        <label className="flex items-center gap-1.5 text-sm text-muted">
          <input type="checkbox" checked={onlyCombat} onChange={(e) => setOnlyCombat(e.target.checked)} className="accent-accent" />
          {t('skills.onlyCombat')}
        </label>
      </div>
      <div className="grid max-h-72 grid-cols-1 gap-1 overflow-y-auto pr-1 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`skill-row ${selectedId === undefined ? 'skill-row-on' : ''}`}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-dashed border-line text-muted">∅</span>
          <span className="text-sm">{t('editor.noSkill')}</span>
        </button>
        {!skills && <p className="p-2 text-sm text-muted">{t('skills.loading')}</p>}
        {skills && filtered.length === 0 && <p className="p-2 text-sm text-muted">{t('skills.none')}</p>}
        {filtered.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s)}
            className={`skill-row ${selectedId === s.id ? 'skill-row-on' : ''}`}
            title={s.name.en}
          >
            <SkillIcon src={s.icon} alt={s.name[key]} size={36} />
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm">{s.name[key]}</span>
              <span className="block truncate text-xs text-muted">{s.name.en}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
