import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { initialPractice, stepPractice, type PracticeState } from '../lib/practice'
import { nameKey, type Combo, type Skill, type Step } from '../lib/types'
import { useControllerInput, useGamepadName } from '../hooks/useGamepad'
import { useCombos } from '../store/combos'
import { ButtonCombo } from './ButtonGlyph'
import { SkillIcon } from './SkillIcon'

type Props = { combo: Combo; byId: Map<number, Skill> }
type Mode = 'pad' | 'cards'

const bestKey = (id: string) => `combomandops5:best:${id}`
const readBest = (id: string) => {
  try {
    const v = Number(localStorage.getItem(bestKey(id)))
    return v > 0 ? v : null
  } catch {
    return null
  }
}

const fmt = (ms: number) => `${(ms / 1000).toFixed(2)} s`

export function PracticeMode({ combo, byId }: Props) {
  const { t } = useTranslation()
  const padName = useGamepadName()
  const [mode, setMode] = useState<Mode>(padName ? 'pad' : 'cards')
  const [hideHints, setHideHints] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [state, setState] = useState<PracticeState>(initialPractice)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [finishedIn, setFinishedIn] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [best, setBest] = useState(() => readBest(combo.id))
  const [streak, setStreak] = useState(0)

  const steps = combo.steps
  const total = steps.length
  const done = state.index >= total && total > 0
  const current = steps[state.index]

  // Refs para leer el estado más reciente desde el bucle del mando sin perder fotogramas
  const stateRef = useRef(state)
  const startRef = useRef<number | null>(null)

  const start = () => {
    if (startRef.current !== null) return
    startRef.current = performance.now()
    setStartedAt(startRef.current)
  }

  const restart = () => {
    stateRef.current = initialPractice()
    startRef.current = null
    setState(stateRef.current)
    setStartedAt(null)
    setFinishedIn(null)
    setRevealed(false)
  }

  // Al terminar: guardar tiempo y racha
  const finish = (mistakes: number) => {
    const ms = startRef.current === null ? 0 : performance.now() - startRef.current
    setFinishedIn(ms)
    setStreak((s) => (mistakes === 0 ? s + 1 : 0))
    if (mode === 'pad' && mistakes === 0 && ms > 0 && (best === null || ms < best)) {
      setBest(ms)
      try {
        localStorage.setItem(bestKey(combo.id), String(Math.round(ms)))
      } catch {
        /* sin almacenamiento: solo en memoria */
      }
    }
  }

  const advance = (next: PracticeState) => {
    stateRef.current = next
    setState(next)
    if (next.index >= total) finish(next.mistakes)
  }

  // Cronómetro visible
  useEffect(() => {
    if (startedAt === null || done) return
    const id = setInterval(() => setNow(performance.now()), 50)
    return () => clearInterval(id)
  }, [startedAt, done])

  useControllerInput(({ pressed, justPressed }) => {
    const current = steps[stateRef.current.index]
    if (!current) return
    if (justPressed.size) start()
    const prev = stateRef.current
    const next = stepPractice(prev, current.buttons, pressed, justPressed)
    if (next !== prev) advance(next)
  }, mode === 'pad' && total > 0)

  if (!total) return <p className="card p-6 text-center text-muted">{t('practice.empty')}</p>

  const elapsed = finishedIn ?? (startedAt !== null ? Math.max(0, now - startedAt) : 0)

  const nextCard = () => {
    start()
    setRevealed(false)
    advance({ ...stateRef.current, index: stateRef.current.index + 1, lastResult: 'ok' })
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-line p-0.5" role="tablist">
          {(['pad', 'cards'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m)
                restart()
              }}
              className={`rounded-md px-3 py-1.5 text-sm ${mode === m ? 'bg-accent text-black' : 'text-muted hover:text-fg'}`}
            >
              {m === 'pad' ? t('practice.withPad') : t('practice.cards')}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={hideHints} onChange={(e) => setHideHints(e.target.checked)} className="accent-accent" />
          {t('practice.hideHints')}
        </label>
        <button type="button" className="btn ml-auto" onClick={restart}>
          ↻ {t('practice.restart')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={t('practice.time')} value={fmt(elapsed)} />
        <Stat label={t('practice.mistakes')} value={String(state.mistakes)} tone={state.mistakes ? 'bad' : undefined} />
        <Stat label={t('practice.best')} value={best ? fmt(best) : '—'} />
        <Stat label={t('practice.streak')} value={String(streak)} />
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full bg-accent transition-all" style={{ width: `${(Math.min(state.index, total) / total) * 100}%` }} />
      </div>

      {done ? (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-2xl font-bold text-accent">{t('practice.done')}</p>
          <p className="text-muted">
            {fmt(elapsed)} · {t('practice.mistakes')}: {state.mistakes}
          </p>
          <button type="button" className="btn btn-primary" onClick={restart}>
            {t('practice.restart')}
          </button>
        </div>
      ) : (
        <>
          <div
            key={`${state.index}-${state.mistakes}`}
            className={`card flex flex-col items-center gap-4 p-6 text-center ${state.lastResult === 'miss' ? 'animate-shake border-red-500/70' : ''}`}
          >
            <p className="text-sm text-muted">{t('practice.step', { n: state.index + 1, total })}</p>
            <StepView step={current} skill={current.skillId !== undefined ? byId.get(current.skillId) : undefined} hidden={hideHints && !revealed} big />
            {mode === 'pad' ? (
              <p className="text-sm text-muted">{padName ? t('practice.waitingPad') : t('pad.disconnected')}</p>
            ) : (
              <div className="flex gap-2">
                {hideHints && !revealed && (
                  <button type="button" className="btn" onClick={() => setRevealed(true)}>
                    {t('practice.reveal')}
                  </button>
                )}
                <button type="button" className="btn btn-primary" onClick={nextCard}>
                  {t('practice.next')} →
                </button>
              </div>
            )}
            {mode === 'pad' && !padName && <p className="text-xs text-muted">{t('pad.keyboardHint')}</p>}
          </div>
          {steps[state.index + 1] && (
            <div className="flex items-center gap-3 px-2 text-sm text-muted">
              <span>{t('practice.upNext')}:</span>
              <StepView
                step={steps[state.index + 1]}
                skill={steps[state.index + 1].skillId !== undefined ? byId.get(steps[state.index + 1].skillId!) : undefined}
                hidden={hideHints}
              />
            </div>
          )}
        </>
      )}
    </section>
  )
}

function StepView({ step, skill, hidden, big }: { step: Step; skill?: Skill; hidden?: boolean; big?: boolean }) {
  const { t } = useTranslation()
  const key = nameKey(useCombos((s) => s.locale))
  return (
    <div className={`flex items-center gap-3 ${big ? 'flex-col' : ''}`}>
      {skill && <SkillIcon src={skill.icon} alt={skill.name[key]} size={big ? 72 : 28} />}
      {skill && <span className={big ? 'text-xl font-semibold' : ''}>{skill.name[key]}</span>}
      {hidden ? (
        <span className="rounded-md border border-dashed border-line px-3 py-2 text-sm text-muted">{t('practice.hidden')}</span>
      ) : (
        step.buttons.length > 0 && <ButtonCombo buttons={step.buttons} size={big ? 'lg' : 'sm'} hold={step.hold} />
      )}
      {big && step.note && !hidden && <span className="text-sm text-muted">{step.note}</span>}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'bad' }) {
  return (
    <div className="card px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${tone === 'bad' ? 'text-red-400' : ''}`}>{value}</div>
    </div>
  )
}
