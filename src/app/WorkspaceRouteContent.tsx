import type { ComponentProps } from 'react'
import { TicketListView } from '../components/board/TicketListView'
import { WorkspaceUnavailable } from './WorkspaceUnavailable'
import { WorkspaceViewPanel } from './WorkspaceViewPanel'

type WorkspaceViewProps = ComponentProps<typeof WorkspaceViewPanel>
interface Props {
  allTickets: boolean
  activeCanvas: WorkspaceViewProps['canvas'] | undefined
  ticketList: ComponentProps<typeof TicketListView>
  workspaceView: Omit<WorkspaceViewProps, 'canvas'>
  unavailable: ComponentProps<typeof WorkspaceUnavailable>
}

export function WorkspaceRouteContent({
  allTickets, activeCanvas, ticketList, workspaceView, unavailable,
}: Props) {
  if (allTickets) return <TicketListView {...ticketList} />
  if (activeCanvas) return <WorkspaceViewPanel canvas={activeCanvas} {...workspaceView} />
  return <WorkspaceUnavailable {...unavailable} />
}
