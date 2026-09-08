import { useEffect, useEffectEvent, useId, useMemo, useRef, useState } from 'react'
import type { TicketListSort, TicketListSortKey } from '../../data/board-summary-order'

interface Props {
  sortKey: TicketListSortKey
  sort: TicketListSort | null
  values: string[]
  selectedValues: string[] | null
  open: boolean
  onOpen: () => void
  onClose: () => void
  onToggleSort: (key: TicketListSortKey) => void
  onToggleValue: (key: TicketListSortKey, value: string) => void
  onSelectAll: (key: TicketListSortKey, selected: boolean) => void
}
const labels: Record<TicketListSortKey, string> = { status: 'Status' }

export function TicketListColumnMenu({ sortKey, sort, values, selectedValues, open, onOpen, onClose, onToggleSort, onToggleValue, onSelectAll }: Props) {
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupId = useId()
  const closeFromEffect = useEffectEvent(onClose)
  const label = labels[sortKey]
  const activeSort = sort?.key === sortKey ? sort.direction : null
  const filterActive = selectedValues !== null
  const selected = useMemo(() => new Set(selectedValues ?? values), [selectedValues, values])
  const visibleValues = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return normalizedQuery ? values.filter((value) => value.toLocaleLowerCase().includes(normalizedQuery)) : values
  }, [query, values])

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeFromEffect()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault(); closeFromEffect(); triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const nextDirection = activeSort === 'ascending' ? 'descending' : 'ascending'
  return <div ref={rootRef} className={`ticket-list-column-menu-wrap ticket-list-column-menu-${sortKey}`}>
    <span>{label}</span><span className="ticket-list-column-actions">
      <button type="button" className={`ticket-list-sort-toggle${activeSort ? ' is-active' : ''}`}
        aria-label={`Sort ${label} ${nextDirection}`} onClick={() => onToggleSort(sortKey)}>
        <span aria-hidden="true">{activeSort === 'ascending' ? '↑' : activeSort === 'descending' ? '↓' : '↕'}</span>
      </button>
      <button ref={triggerRef} type="button" className={`ticket-list-filter-toggle${filterActive ? ' is-filtered' : ''}`}
        aria-label={`Filter ${label}${filterActive ? '; filter applied' : '; showing all'}`} aria-expanded={open} aria-controls={popupId}
        onClick={open ? onClose : onOpen}><span aria-hidden="true">{filterActive ? '●' : ''}▾</span></button>
    </span>
    {open && <div id={popupId} className="ticket-list-filter-menu" role="group" aria-label={`Filter ${label}`}>
      <label className="ticket-list-filter-search"><span className="ticket-list-visually-hidden">Search {label} values</span>
        <input type="search" value={query} placeholder={`Search ${label}`} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="ticket-list-filter-options">
        <label className="ticket-list-filter-option ticket-list-filter-all"><input type="checkbox" checked={!filterActive}
          onChange={(event) => onSelectAll(sortKey, event.target.checked)} /><span>All statuses</span></label>
        {visibleValues.map((value) => <label key={value} className="ticket-list-filter-option"><input type="checkbox" checked={selected.has(value)}
          onChange={() => onToggleValue(sortKey, value)} /><span>{value}</span></label>)}
        {!visibleValues.length && <p className="ticket-list-filter-no-results">No matching values</p>}
      </div>
      <div className="ticket-list-filter-footer"><button type="button" disabled={!filterActive} onClick={() => onSelectAll(sortKey, true)}>Clear filter</button></div>
    </div>}
  </div>
}
