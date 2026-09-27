import { useCallback, useId, useState } from 'react'
import type { BoardColumn } from '../../data/board'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select'

interface Props {
  columnId: string; columns: readonly BoardColumn[]; formId: string; disabled: boolean
  onChange: (columnId: string) => void
}

export function BoardCardStatus({ columnId, columns, formId, disabled, onChange }: Props) {
  const id = useId()
  const [container, setContainer] = useState<HTMLDialogElement | null>(null)
  // Portaling to body would put the menu outside the native modal's top layer and make it inert.
  const triggerRef = useCallback((node: HTMLButtonElement | null) => setContainer(node?.closest('dialog') ?? null), [])
  const current = columns.find(({ id }) => id === columnId)
  return <>
    <label htmlFor={id} className="sr-only">Status</label>
    <Select name="columnId" form={formId} disabled={disabled} value={columnId} onValueChange={onChange}>
      <SelectTrigger ref={triggerRef} id={id} className="kanban-status-trigger" title={current?.title ?? 'Unavailable column'}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent container={container} position="popper" align="start" collisionPadding={12}
        className="kanban-status-menu" aria-label="Status">
        <SelectGroup>
          <SelectLabel>Status</SelectLabel>
          {!current && <SelectItem value={columnId} disabled>Unavailable column</SelectItem>}
          {columns.map((column) => <SelectItem key={column.id} value={column.id}>{column.title}</SelectItem>)}
        </SelectGroup>
      </SelectContent>
    </Select>
  </>
}
