import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { CanvasSectionHarness } from './CanvasSection.story-harness'
import { CanvasCardList } from './CanvasCardList'
import {
  storySectionProps,
  storySections,
} from './component-story-fixtures'

const meta = {
  title: 'Lean Canvas/CanvasCardList',
  component: CanvasCardList,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[320px] rounded-xl bg-[#f1f2f4] p-3 text-[#172b4d]">
        <Story />
      </div>
    ),
  ],
  args: storySectionProps,
  render: (args) => <CanvasSectionHarness {...args}>{(props) => <CanvasCardList {...props} />}</CanvasSectionHarness>,
} satisfies Meta<typeof CanvasCardList>

export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Customer decisions are scattered across too many tools'),
    ).toBeInTheDocument()
  },
}

export const Empty: Story = {
  args: { section: { ...storySections[1], cards: [] } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.canvas-card')).toHaveLength(0)
  },
}

export const Composing: Story = {
  args: {
    addingSectionId: 'problem',
    cardDraft: 'A new customer problem',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'New card' })).toHaveValue(
      'A new customer problem',
    )
  },
}

export const BottomGrid: Story = {
  args: {
    section: storySections.find((section) => section.id === 'cost')!,
    bottom: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[620px] rounded-xl bg-[#f1f2f4] p-3"><Story /></div>
    ),
  ],
}
