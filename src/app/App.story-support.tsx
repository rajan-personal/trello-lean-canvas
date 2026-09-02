/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import App from './App'
import type { AppUser } from '../auth/auth-context'
import { loadExampleCanvases } from '../data/examples'
import { sectionTemplate } from '../data/sections'
import type { LeanCanvas } from '../data/types'

const STORAGE_KEY = 'lean-canvas:v2'
const previewUser: AppUser = {
  uid: 'storybook-user',
  displayName: 'Storybook User',
  email: 'storybook@example.com',
  photoURL: null,
}
export const blankCanvas: LeanCanvas = {
  id: 'storybook-blank',
  name: 'Blank canvas',
  title: 'Blank canvas',
  favorite: false,
  notes: '',
  sections: sectionTemplate.map((section) => ({ ...section, cards: [] })),
}

interface SeededAppProps {
  canvases?: LeanCanvas[]
  samples?: boolean
  reordered?: boolean
}

export function SeededApp({
  canvases = [],
  samples = false,
  reordered = false,
}: SeededAppProps) {
  const [ready, setReady] = useState(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(canvases))
    return !samples
  })
  useEffect(() => {
    if (!samples) return
    void loadExampleCanvases().then((loaded) => {
      const canvases = reordered
        ? [loaded[1], loaded[0], ...loaded.slice(2)]
        : loaded
      localStorage.setItem(STORAGE_KEY, JSON.stringify(canvases))
      setReady(true)
    })
  }, [reordered, samples])
  return ready ? <App previewUser={previewUser} /> : null
}

export const appMeta = {
  title: 'Screens/LeanCanvasWorkspace',
  component: App,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The authenticated Trello-style workspace with independent Lean Canvases.',
      },
    },
  },
  render: () => <SeededApp />,
} satisfies Meta<typeof App>
export type AppStory = StoryObj<typeof appMeta>
