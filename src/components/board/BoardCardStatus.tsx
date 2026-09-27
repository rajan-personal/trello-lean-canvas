import type { BoardColumn } from '../../data/board'

interface Props {
  columnId: string; columns: readonly BoardColumn[]; formId: string; disabled: boolean
  onChange: (columnId: string) => void
}

export function BoardCardStatus({ columnId, columns, formId, disabled, onChange }: Props) {
  return <label className="kanban-status-field">Status
    <select name="columnId" form={formId} disabled={disabled} value={columnId}
      onChange={(event) => onChange(event.target.value)}>
      {!columns.some(({ id }) => id === columnId) && <option value={columnId} disabled>Unavailable column</option>}
      {columns.map((column) => <option key={column.id} value={column.id}>{column.title}</option>)}
    </select>
  </label>
}
