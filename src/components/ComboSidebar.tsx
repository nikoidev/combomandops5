import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CLASSES } from '../lib/data'
import { exportFile, importFile, shareUrl } from '../lib/share'
import { nameKey } from '../lib/types'
import { useCombos } from '../store/combos'
import { SkillIcon } from './SkillIcon'

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  URL.revokeObjectURL(url)
}

export function ComboSidebar({ classSlug }: { classSlug: string }) {
  const { t } = useTranslation()
  const { locale, combos, selectedCombo, selectCombo, selectClass, createCombo, duplicateCombo, deleteCombo, addCombos } = useCombos()
  const key = nameKey(locale)
  const cls = CLASSES.find((c) => c.slug === classSlug)
  const list = combos.filter((c) => c.classSlug === classSlug)
  const fileRef = useRef<HTMLInputElement>(null)
  const [toast, setToast] = useState<string | null>(null)

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const current = list.find((c) => c.id === selectedCombo)

  return (
    <aside className="flex flex-col gap-3">
      <button type="button" onClick={() => selectClass(null)} className="self-start text-sm text-muted hover:text-fg">
        ← {t('combos.back')}
      </button>
      {cls && (
        <div className="flex items-center gap-3">
          <SkillIcon src={cls.icon} alt={cls.name[key]} size={48} />
          <h2 className="text-xl font-semibold">{cls.name[key]}</h2>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{t('combos.title')}</h3>
        <button type="button" className="btn btn-primary" onClick={() => createCombo(classSlug, t('combos.defaultName', { n: list.length + 1 }))}>
          ＋ {t('combos.new')}
        </button>
      </div>

      {list.length === 0 && <p className="text-sm text-muted">{t('combos.empty')}</p>}
      <ul className="flex flex-col gap-1">
        {list.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => selectCombo(c.id)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left ${c.id === selectedCombo ? 'border-accent/70 bg-panel-2' : 'border-line bg-panel hover:bg-panel-2'}`}
            >
              <span className="truncate">{c.name || '—'}</span>
              <span className="shrink-0 text-xs text-muted">{t('combos.steps', { count: c.steps.length })}</span>
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
          <button type="button" className="btn" onClick={() => duplicateCombo(current.id)}>
            {t('combos.duplicate')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareUrl(current))
                flash(t('combos.copied'))
              } catch {
                prompt(t('combos.share'), shareUrl(current))
              }
            }}
          >
            {t('combos.share')}
          </button>
          <button type="button" className="btn hover:!border-red-500/60 hover:!text-red-300" onClick={() => confirm(t('combos.confirmDelete', { name: current.name })) && deleteCombo(current.id)}>
            {t('combos.delete')}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        <button type="button" className="btn" disabled={!list.length} onClick={() => download(`combos-${classSlug}.json`, exportFile(list))}>
          ⤓ {t('combos.export')}
        </button>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
          ⤒ {t('combos.import')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            try {
              const imported = importFile(await file.text())
              if (!imported.length) throw new Error('empty')
              addCombos(imported)
              flash(t('combos.imported', { count: imported.length }))
            } catch {
              flash(t('combos.importError'))
            }
          }}
        />
      </div>

      {toast && (
        <div role="status" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line bg-panel-2 px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </aside>
  )
}
