import { useState } from 'react'

export function useWorkspacePanels() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notepadState, setNotepadState] = useState<'unopened' | 'open' | 'closed'>('unopened')
  const notepadOpen = notepadState === 'open'

  const toggleNotepad = () => {
    if (!notepadOpen) {
      setSidebarOpen(false)
      setSidebarCollapsed(true)
    }
    setNotepadState(notepadOpen ? 'closed' : 'open')
  }

  return {
    sidebarOpen,
    sidebarCollapsed,
    notepadOpen,
    notepadMounted: notepadState !== 'unopened',
    toggleSidebar: () => setSidebarCollapsed((value) => !value),
    openSidebar: () => setSidebarOpen(true),
    closeSidebar: () => setSidebarOpen(false),
    toggleNotepad,
  }
}
