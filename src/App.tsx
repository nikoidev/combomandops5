import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ButtonCombo } from './components/ButtonGlyph'
import { ClassPicker } from './components/ClassPicker'
import { ComboEditor } from './components/ComboEditor'
import { ComboSidebar } from './components/ComboSidebar'
import { useGamepadName } from './hooks/useGamepad'
import { CLASSES } from './lib/data'
import { decodeCombo } from './lib/share'
import { nameKey, type Combo, type Locale } from './lib/types'
import { useCombos } from './store/combos'

export default function App() {
  const { t, i18n } = useTranslation()
  const { locale, setLocale, selectedClass, selectedCombo, combos, selectClass, addCombos, selectCombo } = useCombos()
  const padName = useGamepadName()
  const [shared, setShared] = useState<Combo | null>(() => {
    const m = location.hash.match(/^#c=(.+)$/)
    return m ? decodeCombo(m[1]) : null
  })

  useEffect(() => {
    void i18n.changeLanguage(locale)
    document.documentElement.lang = locale
  }, [locale, i18n])

  // Si la clase guardada ya no existe en los datos, volver al selector
  useEffect(() => {
    if (selectedClass && !CLASSES.some((c) => c.slug === selectedClass)) selectClass(null)
  }, [selectedClass, selectClass])

  const combo = combos.find((c) => c.id === selectedCombo && c.classSlug === selectedClass)

  const closeShared = () => {
    history.replaceState(null, '', location.pathname + location.search)
    setShared(null)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6">
      <header className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => selectClass(null)} className="flex items-center gap-3 text-left">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-10 w-10" />
          <span>
            <span className="block text-lg font-bold leading-tight">{t('app.title')}</span>
            <span className="block text-xs text-muted">{t('app.subtitle')}</span>
          </span>
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${padName ? 'border-emerald-500/40 text-emerald-300' : 'border-line text-muted'}`}
            title={padName ?? t('pad.disconnected')}
          >
            <span className={`h-2 w-2 rounded-full ${padName ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {padName ? t('pad.connected') : '🎮'}
          </span>
          <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)} aria-label={t('lang.label')} className="input py-1 text-sm">
            <option value="es-419">{t('lang.es-419')}</option>
            <option value="es-ES">{t('lang.es-ES')}</option>
          </select>
        </div>
      </header>

      {!padName && <p className="-mt-3 text-xs text-muted">{t('pad.disconnected')}</p>}

      <main className="flex-1">
        {!selectedClass ? (
          <ClassPicker />
        ) : (
          <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
            <ComboSidebar classSlug={selectedClass} />
            {combo ? <ComboEditor combo={combo} /> : <EmptyEditor />}
          </div>
        )}
      </main>

      <footer className="border-t border-line pt-3 text-xs text-muted">{t('app.credits')}</footer>

      {shared && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal aria-labelledby="shared-title">
          <div className="card flex w-full max-w-md flex-col gap-3 p-5">
            <h2 id="shared-title" className="text-lg font-semibold">
              {t('combos.sharedTitle')}
            </h2>
            <p>
              <strong>{shared.name}</strong> · {CLASSES.find((c) => c.slug === shared.classSlug)?.name[nameKey(locale)] ?? shared.classSlug} ·{' '}
              {t('combos.steps', { count: shared.steps.length })}
            </p>
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {shared.steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-muted">{i + 1}</span>
                  <ButtonCombo buttons={s.buttons} size="sm" hold={s.hold} />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={closeShared}>
                {t('combos.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  addCombos([shared])
                  selectClass(shared.classSlug)
                  selectCombo(shared.id)
                  closeShared()
                }}
              >
                {t('combos.sharedAdd')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyEditor() {
  const { t } = useTranslation()
  return (
    <div className="card flex flex-col items-center justify-center gap-3 p-10 text-center text-muted">
      <ButtonCombo buttons={['L2', 'square']} size="lg" />
      <p>{t('combos.empty')}</p>
    </div>
  )
}
