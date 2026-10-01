import { createContext } from 'react'
import type { TicketRunClient } from '../../data/ticket-run'

export const TicketRunContext = createContext<TicketRunClient | null>(null)
