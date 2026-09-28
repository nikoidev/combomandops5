import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import { nameKey, type Skill, type Step } from '../lib/types'
import { useCombos } from '../store/combos'
import { ButtonCombo } from './ButtonGlyph'
import { SkillIcon } from './SkillIcon'

type Props = {
  steps: Step[]
  byId: Map<number, Skill>
  editingId: string | null
  onEdit: (index: number) => void
  onMove: (from: number, to: number) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
}

export function StepList({ steps, byId, editingId, onEdit, onMove, onDuplicate, onRemove }: Props) {
  const { t } = useTranslation()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = steps.findIndex((s) => s.id === active.id)
    const to = steps.findIndex((s) => s.id === over.id)
    if (from >= 0 && to >= 0) onMove(from, to)
  }

  if (!steps.length) return <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">{t('editor.noSteps')}</p>

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <ol className="flex flex-col gap-2">
          {steps.map((step, i) => (
            <StepRow
              key={step.id}
              step={step}
              index={i}
              last={i === steps.length - 1}
              skill={step.skillId !== undefined ? byId.get(step.skillId) : undefined}
              editing={editingId === step.id}
              onEdit={() => onEdit(i)}
              onUp={() => onMove(i, i - 1)}
              onDown={() => onMove(i, i + 1)}
              onDuplicate={() => onDuplicate(step.id)}
              onRemove={() => onRemove(step.id)}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}

type RowProps = {
  step: Step
  index: number
  last: boolean
  skill?: Skill
  editing: boolean
  onEdit: () => void
  onUp: () => void
  onDown: () => void
  onDuplicate: () => void
  onRemove: () => void
}

function StepRow({ step, index, last, skill, editing, onEdit, onUp, onDown, onDuplicate, onRemove }: RowProps) {
  const { t } = useTranslation()
  const key = nameKey(useCombos((s) => s.locale))
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-center gap-2 rounded-lg border bg-panel p-2 ${isDragging ? 'z-10 border-accent shadow-lg' : editing ? 'border-accent/70' : 'border-line'}`}
    >
      <button type="button" {...attributes} {...listeners} className="cursor-grab touch-none px-1 text-muted hover:text-fg" aria-label={t('editor.drag')} title={t('editor.drag')}>
        ⠿
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums text-muted">{index + 1}</span>
      <button type="button" onClick={onEdit} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-left">
        {skill && <SkillIcon src={skill.icon} alt={skill.name[key]} size={36} />}
        <span className="flex min-w-0 flex-col gap-1">
          {skill && <span className="truncate text-sm font-medium">{skill.name[key]}</span>}
          {step.buttons.length > 0 && <ButtonCombo buttons={step.buttons} size="sm" hold={step.hold} />}
          {step.note && <span className="truncate text-xs text-muted">{step.note}</span>}
        </span>
      </button>
      <span className="flex shrink-0 items-center gap-0.5 opacity-70 group-hover:opacity-100">
        <IconBtn label={t('editor.moveUp')} onClick={onUp} disabled={index === 0}>↑</IconBtn>
        <IconBtn label={t('editor.moveDown')} onClick={onDown} disabled={last}>↓</IconBtn>
        <IconBtn label={t('editor.duplicate')} onClick={onDuplicate}>⧉</IconBtn>
        <IconBtn label={t('editor.remove')} onClick={onRemove} danger>✕</IconBtn>
      </span>
    </li>
  )
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`h-8 w-8 rounded-md text-sm text-muted hover:bg-panel-2 disabled:opacity-30 ${danger ? 'hover:text-red-400' : 'hover:text-fg'}`}
    >
      {children}
    </button>
  )
}
