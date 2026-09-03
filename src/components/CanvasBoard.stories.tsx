import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { CanvasBoard } from './CanvasBoard'
import {
  storyBoardSectionProps,
  storySections,
} from './component-story-fixtures'

const meta = {
  title: 'Lean Canvas/CanvasBoard',
  component: CanvasBoard,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="h-dvh min-h-[640px] bg-linear-[130deg,#0c66e4_0%,#338bfa_100%]">
        <Story />
      </div>
    ),
  ],
  args: {
    sections: storySections,
    sectionProps: storyBoardSectionProps,
  },
} satisfies Meta<typeof CanvasBoard>

export default meta
type Story = StoryObj<typeof meta>

export const CompleteCanvas: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.canvas-column')).toHaveLength(5)
    await expect(canvasElement.querySelectorAll('.bottom-panel')).toHaveLength(2)
    await expect(canvasElement.querySelectorAll('.canvas-cell')).toHaveLength(12)
  },
}

export const EmptyCanvas: Story = {
  args: {
    sections: storySections.map((section) => ({ ...section, cards: [] })),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.cell-hint')).toHaveLength(12)
  },
}

export const ComposingInProblem: Story = {
  args: {
    sectionProps: {
      ...storyBoardSectionProps,
      addingSectionId: 'problem',
      cardDraft: 'Draft customer problem',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'New card' })).toHaveValue(
      'Draft customer problem',
    )
  },
}

export const MobileScrollable: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvasElement }) => {
    const board = canvasElement.querySelector('.board-scroll')
    const grid = canvasElement.querySelector('.lean-grid')
    if (!(board instanceof HTMLElement) || !(grid instanceof HTMLElement)) {
      throw new Error('Mobile canvas layout is incomplete')
    }
    await expect(getComputedStyle(grid).display).toBe('grid')
    await expect(grid.getBoundingClientRect().width).toBeGreaterThan(
      board.clientWidth,
    )
  },
}
