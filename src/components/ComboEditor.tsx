import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Combo } from '../lib/types'
import { useSkills } from '../hooks/useSkills'
import { useCombos } from '../store/combos'
import { PracticeMode } from './PracticeMode'
import { StepBuilder } from './StepBuilder'
import { StepList } from './StepList'

export function ComboEditor({ combo }: { combo: Combo }) {
  const { t } = useTranslation()
  const { skills, byId } = useSkills(combo.classSlug)
  const { renameCombo, addStep, updateStep, removeStep, duplicateStep, moveStep } = useCombos()
  const [tab, setTab] = useState<'edit' | 'practice'>('edit')
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingIndex = editingId ? combo.steps.findIndex((s) => s.id === editingId) : -1
  const editing = editingIndex >= 0 ? { index: editingIndex, step: combo.steps[editingIndex] } : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={combo.name}
          onChange={(e) => renameCombo(combo.id, e.target.value)}
          aria-label={t('combos.rename')}
          maxLength={80}
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-2xl font-bold hover:border-line focus:border-accent focus:outline-none"
        />
        <div className="inline-flex rounded-lg border border-line p-0.5" role="tablist">
          {(['edit', 'practice'] as const).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === k ? 'bg-accent text-black' : 'text-muted hover:text-fg'}`}
            >
              {k === 'edit' ? t('editor.edit') : t('editor.practice')}
            </button>
          ))}
        </div>
      </div>

      {tab === 'practice' ? (
        <PracticeMode key={combo.id} combo={combo} byId={byId} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <section className="flex flex-col gap-2">
            <h3 className="font-semibold">
              {t('editor.steps')} <span className="text-sm font-normal text-muted">· {t('combos.steps', { count: combo.steps.length })}</span>
            </h3>
            <StepList
              steps={combo.steps}
              byId={byId}
              editingId={editingId}
              onEdit={(i) => setEditingId(combo.steps[i].id === editingId ? null : combo.steps[i].id)}
              onMove={(from, to) => moveStep(combo.id, from, to)}
              onDuplicate={(id) => duplicateStep(combo.id, id)}
              onRemove={(id) => {
                if (id === editingId) setEditingId(null)
                removeStep(combo.id, id)
              }}
            />
          </section>
          <div className="lg:sticky lg:top-4 lg:self-start">
            <StepBuilder
              key={editingId ?? 'new'}
              skills={skills}
              byId={byId}
              editing={editing}
              onSubmit={(draft) => {
                if (editing) {
                  updateStep(combo.id, editing.step.id, { hold: undefined, note: undefined, skillId: undefined, ...draft })
                  setEditingId(null)
                } else {
                  addStep(combo.id, draft)
                }
              }}
              onCancelEdit={() => setEditingId(null)}
              onRecord={(buttons) => addStep(combo.id, { buttons })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
