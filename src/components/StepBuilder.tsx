import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DIRECTIONS, sortButtons } from '../lib/buttons'
import { nameKey, type PsButton, type Skill, type Step } from '../lib/types'
import { useControllerInput, type InputFrame } from '../hooks/useGamepad'
import { useCombos } from '../store/combos'
import { ButtonCombo } from './ButtonGlyph'
import { DualSense } from './DualSense'
import { SkillIcon } from './SkillIcon'
import { SkillPicker } from './SkillPicker'

type Draft = Omit<Step, 'id'>
const EMPTY: Draft = { buttons: [] }

type Props = {
  skills: Skill[] | null
  byId: Map<number, Skill>
  /** Paso que se está editando (índice en la secuencia) o null para uno nuevo */
  editing: { index: number; step: Step } | null
  onSubmit: (draft: Draft) => void
  onCancelEdit: () => void
  /** Grabación: cada combinación pulsada en el mando se añade como paso */
  onRecord: (buttons: PsButton[]) => void
}

export function StepBuilder({ skills, byId, editing, onSubmit, onCancelEdit, onRecord }: Props) {
  const { t } = useTranslation()
  const key = nameKey(useCombos((s) => s.locale))
  // El padre usa `key` para reiniciar el borrador al cambiar de paso
  const [draft, setDraft] = useState<Draft>(() => (editing ? { ...editing.step } : EMPTY))
  const [showSkills, setShowSkills] = useState(false)
  const [recording, setRecording] = useState(false)
  const [live, setLive] = useState<Set<PsButton>>(new Set())
  const chord = useRef<Set<PsButton>>(new Set())

  useControllerInput(({ pressed }: InputFrame) => {
    setLive((prev) => (prev.size === pressed.size && [...pressed].every((b) => prev.has(b)) ? prev : new Set(pressed)))
    if (!recording) return
    // Se agrupa todo lo pulsado hasta soltar los botones (las direcciones pueden seguir mantenidas)
    pressed.forEach((b) => chord.current.add(b))
    const actions = [...pressed].filter((b) => !DIRECTIONS.includes(b))
    const chordHasAction = [...chord.current].some((b) => !DIRECTIONS.includes(b))
    if (actions.length === 0 && chordHasAction) {
      onRecord(sortButtons([...chord.current]))
      chord.current = new Set(pressed)
    }
  })

  const toggle = (b: PsButton) =>
    setDraft((d) => ({
      ...d,
      buttons: d.buttons.includes(b) ? d.buttons.filter((x) => x !== b) : sortButtons([...d.buttons, b]),
    }))

  const skill = draft.skillId !== undefined ? byId.get(draft.skillId) : undefined
  const canSubmit = draft.buttons.length > 0 || draft.skillId !== undefined

  const submit = () => {
    if (!canSubmit) return
    onSubmit({
      buttons: draft.buttons,
      ...(draft.skillId !== undefined ? { skillId: draft.skillId } : {}),
      ...(draft.hold ? { hold: true } : {}),
      ...(draft.note?.trim() ? { note: draft.note.trim() } : {}),
    })
    setDraft(EMPTY)
    setShowSkills(false)
  }

  return (
    <section className="card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{editing ? t('editor.editing', { n: editing.index + 1 }) : t('editor.builder')}</h3>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              chord.current = new Set()
              setRecording((r) => !r)
            }}
            className={recording ? 'btn btn-danger' : 'btn'}
          >
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${recording ? 'animate-pulse bg-white' : 'bg-red-500'}`} />
            {recording ? t('editor.stopRecording') : t('editor.record')}
          </button>
        )}
      </div>

      {recording && <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-200">{t('editor.recording')}</p>}

      <p className="text-sm text-muted">{t('editor.buttons')}</p>
      <div className="mx-auto w-full max-w-xl">
        <DualSense selected={new Set(draft.buttons)} live={live} onToggle={recording ? undefined : toggle} />
      </div>

      <div className="flex min-h-11 flex-wrap items-center gap-3 rounded-lg border border-line bg-panel-2 px-3 py-2">
        {draft.buttons.length ? <ButtonCombo buttons={draft.buttons} hold={draft.hold} /> : <span className="text-sm text-muted">—</span>}
        {draft.buttons.length > 0 && (
          <button type="button" className="ml-auto text-xs text-muted underline hover:text-fg" onClick={() => setDraft((d) => ({ ...d, buttons: [] }))}>
            {t('editor.clear')}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => setShowSkills((v) => !v)} className="btn justify-start" aria-expanded={showSkills}>
          {skill ? <SkillIcon src={skill.icon} alt={skill.name[key]} size={28} /> : <span className="text-muted">＋</span>}
          <span className="truncate">{skill ? skill.name[key] : t('editor.chooseSkill')}</span>
          <span className="ml-auto text-muted">{showSkills ? '▴' : '▾'}</span>
        </button>
        {showSkills && (
          <SkillPicker
            skills={skills}
            selectedId={draft.skillId}
            onSelect={(s) => {
              setDraft((d) => {
                const { skillId: _old, ...rest } = d
                return s ? { ...rest, skillId: s.id } : rest
              })
              setShowSkills(false)
            }}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!draft.hold} onChange={(e) => setDraft((d) => ({ ...d, hold: e.target.checked }))} className="accent-accent" />
          {t('editor.hold')}
        </label>
        <input
          value={draft.note ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
          placeholder={t('editor.notePlaceholder')}
          aria-label={t('editor.note')}
          maxLength={200}
          className="input min-w-0 flex-1"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {editing && (
          <button type="button" className="btn" onClick={onCancelEdit}>
            {t('editor.cancelEdit')}
          </button>
        )}
        <button type="button" className="btn btn-primary" disabled={!canSubmit} onClick={submit}>
          {editing ? t('editor.save') : t('editor.add')}
        </button>
      </div>
    </section>
  )
}
