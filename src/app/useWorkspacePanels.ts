import { useState } from 'react'

export function useWorkspacePanels() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notepadOpen, setNotepadOpen] = useState(false)

  const toggleNotepad = () => {
    if (!notepadOpen) {
      setSidebarOpen(false)
      setSidebarCollapsed(true)
    }
    setNotepadOpen((value) => !value)
  }

  return {
    sidebarOpen,
    sidebarCollapsed,
    notepadOpen,
    toggleSidebar: () => setSidebarCollapsed((value) => !value),
    openSidebar: () => setSidebarOpen(true),
    closeSidebar: () => setSidebarOpen(false),
    toggleNotepad,
  }
}
