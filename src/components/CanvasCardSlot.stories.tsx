import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { CanvasCardSlot } from './CanvasCardSlot'
import { storySectionProps } from './component-story-fixtures'

const meta = {
  title: 'Lean Canvas/CanvasCardSlot',
  component: CanvasCardSlot,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => <div className="w-[300px] text-[#172b4d]"><Story /></div>,
  ],
  args: {
    card: storySectionProps.section.cards[0],
    index: 0,
    sectionProps: storySectionProps,
  },
} satisfies Meta<typeof CanvasCardSlot>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTitle('Double-click to edit; drag to move'))
      .toBeInTheDocument()
  },
}

export const Editing: Story = {
  args: {
    sectionProps: {
      ...storySectionProps,
      editingCard: {
        sectionId: storySectionProps.section.id,
        index: 0,
        value: storySectionProps.section.cards[0],
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Edit card' })).toHaveFocus()
  },
}

export const Dragged: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: false },
          { id: 'landmark-one-main', enabled: false },
          { id: 'page-has-heading-one', enabled: false },
          { id: 'region', enabled: false },
        ],
      },
    },
  },
  args: {
    sectionProps: {
      ...storySectionProps,
      dragHandlers: {
        ...storySectionProps.dragHandlers,
        draggedCard: { sectionId: 'problem', index: 0, height: 42 },
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('.canvas-card-drop-slot'),
    ).toHaveStyle({ opacity: '0.35' })
  },
}

export const ShiftedForDrop: Story = {
  args: {
    sectionProps: {
      ...storySectionProps,
      dragHandlers: {
        ...storySectionProps.dragHandlers,
        draggedCard: { sectionId: 'problem', index: 1, height: 42 },
        dropTarget: { sectionId: 'problem', index: 0 },
      },
    },
  },
}
