import { useCallback, useState } from 'react'
import { storyPointValues, storyPointLabel, storyPointGuidance, storyPointsSchema, type StoryPoints } from '../../data/board'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface Props {
  id: string; helpId: string; value: StoryPoints | null; disabled: boolean
  onChange: (value: StoryPoints | null) => void
}

export function BoardCardStoryPoints({ id, helpId, value, disabled, onChange }: Props) {
  const [container, setContainer] = useState<HTMLDialogElement | null>(null)
  const triggerRef = useCallback((node: HTMLButtonElement | null) => setContainer(node?.closest('dialog') ?? null), [])
  const help = value == null ? 'Not estimated. Optional estimate of effort, complexity, and uncertainty.' : storyPointGuidance[value]
  return <div className="kanban-story-points-field">
    <label htmlFor={id}>Story points</label>
    <Select name="storyPoints" disabled={disabled} value={value == null ? 'none' : String(value)}
      onValueChange={(next) => onChange(next === 'none' ? null : storyPointsSchema.parse(Number(next)))}>
      <SelectTrigger ref={triggerRef} id={id} size="sm" className="kanban-points-trigger min-w-[4.5rem] h-8"
        aria-describedby={helpId} title={help}>
        <SelectValue>{value == null ? '—' : storyPointLabel(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent container={container} position="popper" align="start" collisionPadding={12} aria-label="Story points">
        <SelectItem value="none">Not estimated</SelectItem>
        {storyPointValues.map((points) => <SelectItem key={points} value={String(points)} title={storyPointGuidance[points]}>
          {storyPointLabel(points)}
        </SelectItem>)}
      </SelectContent>
    </Select>
    <span id={helpId} className="sr-only">{help}</span>
  </div>
}
