import { useMemo, useState } from 'react'
import { groupTicketListRows, summaryTickets, type TicketListSort, type TicketListSortKey } from '../../data/board-summary-order'
import { TicketListColumnMenu } from './TicketListColumnMenu'
import { TicketProjectGroup, TicketProjectStates, type TicketListProject } from './TicketListRows'
import './ticket-list.css'

interface Props {
  projects: TicketListProject[]; blocked: boolean
  onOpenTicket: (projectId: string, ticketId: string) => void
  onOpenProjectBoard: (projectId: string) => void
  onRetry: (projectId: string) => void
}
type Filters = Record<TicketListSortKey, string[] | null>

export function TicketListView({ projects, blocked, onOpenTicket, onOpenProjectBoard, onRetry }: Props) {
  const [sort, setSort] = useState<TicketListSort | null>(null)
  const [filters, setFilters] = useState<Filters>({ status: null })
  const [openMenu, setOpenMenu] = useState<TicketListSortKey | null>(null)
  const rows = useMemo(() => summaryTickets(projects.filter(({ loading, error }) => !loading && !error)), [projects])
  const options = useMemo<Record<TicketListSortKey, string[]>>(() => ({
    status: [...new Set(rows.map(({ status }) => status))],
  }), [rows])
  const filterSet = useMemo(() => filters.status && new Set(filters.status), [filters.status])
  const filteredRows = useMemo(() => rows.filter((row) => !filterSet || filterSet.has(row.status)), [filterSet, rows])
  const groups = useMemo(() => groupTicketListRows(filteredRows, sort), [filteredRows, sort])
  const toggleSort = (key: TicketListSortKey) => setSort((current) => current?.key === key
    ? { key, direction: current.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' })
  const toggleFilterValue = (key: TicketListSortKey, value: string) => setFilters((current) => {
    const selected = new Set(current[key] ?? options[key])
    if (selected.has(value)) selected.delete(value); else selected.add(value)
    return { ...current, [key]: selected.size === options[key].length ? null : [...selected] }
  })
  const selectAll = (key: TicketListSortKey, selected: boolean) => setFilters((current) => ({ ...current, [key]: selected ? null : [] }))
  const filterSummary = `${filters.status === null ? 'No filters applied.' : 'Filters applied.'} Showing ${filteredRows.length} of ${rows.length} tickets.`
  return <main className="ticket-list-area" aria-labelledby="all-tickets-heading"><div className="ticket-list-content">
    <header className="ticket-list-heading"><h1 id="all-tickets-heading" className="ticket-list-visually-hidden">All tickets</h1><p className="ticket-list-sort-status ticket-list-visually-hidden" aria-live="polite">Projects in sidebar order. {sort ? `Sorted by Status, ${sort.direction}.` : 'Tickets in board order.'} {filterSummary}</p></header>
    {projects.length ? <div className="ticket-list-table-shell"><table className="ticket-list-table">
      <caption className="ticket-list-visually-hidden">Tickets grouped by project</caption><colgroup><col className="ticket-list-ticket-column" /><col className="ticket-list-project-column" /><col className="ticket-list-status-column" /><col className="ticket-list-points-column" /></colgroup>
      <thead><tr><th scope="col" aria-sort="none">Ticket</th><th scope="col">Project</th>{(['status'] as const).map((key) => <th key={key} scope="col" aria-sort={sort?.key === key ? sort.direction : 'none'}>
        <TicketListColumnMenu sortKey={key} sort={sort} values={options[key]} selectedValues={filters[key]} open={openMenu === key}
          onOpen={() => setOpenMenu(key)} onClose={() => setOpenMenu(null)} onToggleSort={toggleSort} onToggleValue={toggleFilterValue} onSelectAll={selectAll} />
      </th>)}<th scope="col" aria-sort="none"><span className="ticket-list-points-heading-full">Story points</span><span className="ticket-list-points-heading-short">Points</span></th></tr></thead>
      <TicketProjectStates projects={projects} blocked={blocked} onOpenProjectBoard={onOpenProjectBoard} onRetry={onRetry} />
      {groups.map((group) => <TicketProjectGroup key={group.projectId} group={group} blocked={blocked} onOpenProjectBoard={onOpenProjectBoard} onOpenTicket={onOpenTicket} />)}
      {rows.length > 0 && filteredRows.length === 0 && <tbody className="ticket-list-no-matches"><tr><td colSpan={4}>No tickets match the selected filters.</td></tr></tbody>}
    </table></div> : <p className="ticket-list-message ticket-list-empty-state" role="status">No projects yet.</p>}
  </div></main>
}
