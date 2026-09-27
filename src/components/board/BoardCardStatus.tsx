import { ChevronDown } from 'lucide-react'
import type { BoardColumn } from '../../data/board'

interface Props {
  columnId: string; columns: readonly BoardColumn[]; formId: string; disabled: boolean
  onChange: (columnId: string) => void
}

export function BoardCardStatus({ columnId, columns, formId, disabled, onChange }: Props) {
  const current = columns.find(({ id }) => id === columnId)
  return <label className="kanban-status-field">
    <span className="sr-only">Status</span>
    <span className="kanban-status-dot" aria-hidden="true" />
    <select name="columnId" form={formId} disabled={disabled} value={columnId} title={current?.title ?? 'Unavailable column'}
      onChange={(event) => onChange(event.target.value)}>
      {!current && <option value={columnId} disabled>Unavailable column</option>}
      {columns.map((column) => <option key={column.id} value={column.id}>{column.title}</option>)}
    </select>
    <ChevronDown className="kanban-status-chevron" size={14} aria-hidden="true" />
  </label>
}
