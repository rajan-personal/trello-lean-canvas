import type { BoardData } from '../../data/board'

interface Props {
  columnId: string; board: BoardData; formId: string; disabled: boolean
  onChange: (columnId: string) => void
}

export function BoardCardStatus({ columnId, board, formId, disabled, onChange }: Props) {
  return <label className="kanban-status-field">Status
    <select name="columnId" form={formId} disabled={disabled} value={columnId}
      onChange={(event) => onChange(event.target.value)}>
      {!board.columns.some(({ id }) => id === columnId) && <option value={columnId} disabled>Unavailable column</option>}
      {board.columns.map((column) => <option key={column.id} value={column.id}>{column.title}</option>)}
    </select>
  </label>
}
