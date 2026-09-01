import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import App from './App'
import { sectionTemplate, type LeanCanvas } from './data'

const STORAGE_KEY = 'lean-canvas:v2'

const blankCanvas: LeanCanvas = {
  id: 'storybook-blank',
  name: 'Blank canvas',
  title: 'Blank canvas',
  favorite: false,
  sections: sectionTemplate.map((section) => ({ ...section, cards: [] })),
}

interface SeededAppProps {
  canvases?: LeanCanvas[]
}

function SeededApp({ canvases }: SeededAppProps) {
  const [seeded] = useState(() => {
    if (canvases) localStorage.setItem(STORAGE_KEY, JSON.stringify(canvases))
    else localStorage.removeItem(STORAGE_KEY)
    return true
  })
  return seeded ? <App /> : null
}

const meta = {
  title: 'Screens/LeanCanvasWorkspace',
  component: App,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    chromatic: { viewports: [1440] },
    docs: {
      description: {
        component: 'The complete Trello-style workspace with independent Lean Canvases and local persistence.',
      },
    },
  },
  render: () => <SeededApp />,
} satisfies Meta<typeof App>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Airbnb — 2008' })).toBeInTheDocument()
    await expect(canvas.getByText('Booking fees from travellers')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Load sample data' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Add canvas' })).toBeInTheDocument()
  },
}

export const BlankCanvas: Story = {
  render: () => <SeededApp canvases={[blankCanvas]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Blank canvas' })).toBeInTheDocument()
    await expect(canvasElement.querySelectorAll('.cell-hint')).toHaveLength(12)
    const grid = canvasElement.querySelector('.lean-grid')
    const board = canvasElement.querySelector('.board-scroll')
    if (!(grid instanceof HTMLElement) || !(board instanceof HTMLElement)) throw new Error('Blank canvas layout is incomplete')
    const boardStyles = getComputedStyle(board)
    const boardContentHeight = board.clientHeight
      - Number.parseFloat(boardStyles.paddingTop)
      - Number.parseFloat(boardStyles.paddingBottom)
    await expect(grid.getBoundingClientRect().height).toBeCloseTo(boardContentHeight, 1)
  },
}

export const MobileSidebar: Story = {
  globals: {
    viewport: { value: 'mobile1', isRotated: false },
  },
  parameters: {
    chromatic: { viewports: [390] },
  },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const openSidebar = canvas.getByRole('button', { name: 'Open sidebar' })
    await expect(openSidebar).toBeVisible()
    await userEvent.click(openSidebar)
    await expect(canvas.getByRole('navigation', { name: 'Lean canvases' })).toBeVisible()
  },
}

export const CollapsedSidebar: Story = {
  parameters: {
    docs: { story: { autoplay: true } },
  },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }))
    await expect(canvas.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()
    await waitFor(() => expect(canvasElement.querySelector('#canvas-sidebar')?.getBoundingClientRect().width).toBe(0))
  },
}

export const CreateCanvasDialog: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Add canvas' }))
    await expect(canvas.getByRole('dialog', { name: 'Create canvas' })).toBeInTheDocument()
    await expect(canvas.getByRole('textbox', { name: 'Canvas name' })).toHaveFocus()
  },
}

export const AddCardDraftResume: Story = {
  render: () => <SeededApp canvases={[blankCanvas]} />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const section = canvasElement.querySelector('.canvas-column.problem .canvas-cell')
    if (!section) throw new Error('Problem section is missing')
    const sectionCanvas = within(section as HTMLElement)

    await userEvent.click(sectionCanvas.getByRole('button', { name: '＋ Add a card' }))
    await userEvent.type(sectionCanvas.getByRole('textbox', { name: 'New card' }), 'A draft worth keeping')
    await userEvent.click(sectionCanvas.getByText('Problem'))
    await expect(sectionCanvas.queryByRole('textbox', { name: 'New card' })).not.toBeInTheDocument()

    await userEvent.click(sectionCanvas.getByRole('button', { name: '＋ Add a card' }))
    const reopened = sectionCanvas.getByRole('textbox', { name: 'New card' })
    await expect(reopened).toHaveValue('A draft worth keeping')
    await expect(reopened).toHaveFocus()
    await expect(reopened).toHaveProperty('selectionStart', 'A draft worth keeping'.length)
    await expect(canvas.queryByRole('button', { name: 'Cancel adding card' })).not.toBeInTheDocument()
  },
}
