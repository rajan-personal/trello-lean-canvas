import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CanvasSection } from './CanvasSection'
import { CanvasSectionHarness } from './CanvasSection.story-harness'
import {
  costSection,
  defaultDragHandlers,
  problemSection,
} from './CanvasSection.story-fixtures'

export { costSection, defaultDragHandlers, problemSection }

export const canvasSectionMeta = {
  title: 'Lean Canvas/CanvasSection',
  component: CanvasSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A stateful Lean Canvas cell covering empty, populated, composing, editing, and bottom-panel states.',
      },
    },
  },
  decorators: [
    (Story, context) => (
      <div
        className={
          context.args.bottom
            ? 'storybook-bottom-section-frame flex h-[260px] w-[620px] overflow-hidden rounded-xl bg-[#f1f2f4] text-[#172b4d]'
            : 'storybook-section-frame flex h-[520px] w-[300px] overflow-hidden rounded-xl bg-[#f1f2f4] text-[#172b4d]'
        }
      >
        <Story />
      </div>
    ),
  ],
  args: {
    section: problemSection,
    bottom: false,
    addingSectionId: null,
    cardDraft: '',
    editingCard: null,
    setAddingSectionId: fn(),
    setCardDraft: fn(),
    addCard: fn(),
    editCard: fn(),
    deleteCard: fn(),
    setEditingCard: fn(),
    saveEditedCard: fn(),
    startAddingCard: fn(),
    dragHandlers: defaultDragHandlers,
  },
  render: (args) => (
    <CanvasSectionHarness
      key={JSON.stringify([
        args.section,
        args.bottom,
        args.addingSectionId,
        args.cardDraft,
        args.editingCard,
      ])}
      {...args}
    />
  ),
} satisfies Meta<typeof CanvasSection>

export type CanvasSectionStory = StoryObj<typeof canvasSectionMeta>
