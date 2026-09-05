import { useState, type ComponentProps } from 'react'
import { Sidebar } from './Sidebar'

export function SidebarHarness(args: ComponentProps<typeof Sidebar>) {
  const [canvases, setCanvases] = useState(args.canvases)
  const [activeId, setActiveId] = useState(args.activeId)
  const [open, setOpen] = useState(args.open)
  const [signedOut, setSignedOut] = useState(false)
  if (signedOut) return <p>Signed out</p>
  return <Sidebar {...args} canvases={canvases} activeId={activeId} open={open}
    onClose={() => { args.onClose(); setOpen(false) }}
    onSelect={(id) => { args.onSelect(id); setActiveId(id) }}
    onSignOut={async () => { await args.onSignOut(); setSignedOut(true) }}
    onMove={(id, index) => {
      args.onMove(id, index)
      setCanvases((current) => {
        const next = [...current]
        const from = next.findIndex((canvas) => canvas.id === id)
        if (from < 0) return current
        const [moved] = next.splice(from, 1)
        next.splice(Math.max(0, Math.min(index, current.length - 1)), 0, moved)
        return next
      })
    }} />
}
