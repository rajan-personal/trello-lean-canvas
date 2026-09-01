import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { sectionTemplate, type CanvasSectionData, type SectionId } from '../data'
import { CanvasSection } from './CanvasSection'

function getSectionTemplate(sectionId: SectionId): CanvasSectionData {
  const section = sectionTemplate.find((candidate) => candidate.id === sectionId)
  if (!section) throw new Error(`Missing section template: ${sectionId}`)
  return section
}

const problemSection: CanvasSectionData = {
  ...getSectionTemplate('problem'),
  cards: [
    'Decisions disappear across chat, docs, and meetings',
    'Weekly status updates take team leads 2–3 hours',
    'Remote teams cannot see blockers early enough',
  ],
}

const costSection: CanvasSectionData = {
  ...getSectionTemplate('cost'),
  cards: ['Fixed\nProduct team and infrastructure', 'Variable\nAI summaries and support'],
}

const meta = {
  title: 'Lean Canvas/CanvasSection',
  component: CanvasSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A Lean Canvas cell that presents its heading, guidance, cards, and add-card workflow.',
      },
    },
  },
  decorators: [
    (Story) => <div className="storybook-section-frame"><Story /></div>,
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
    dragHandlers: {
      onDrop: fn(),
      onDragStart: fn(),
      onDragEnd: fn(),
    },
  },
} satisfies Meta<typeof CanvasSection>

export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getAllByTitle('Double-click to edit; drag to move')).toHaveLength(3)
    await userEvent.click(canvas.getByRole('button', { name: '＋ Add a card' }))
    await expect(args.startAddingCard).toHaveBeenCalledWith('problem')
  },
}

export const Empty: Story = {
  args: {
    section: { ...problemSection, cards: [] },
  },
}

export const Composing: Story = {
  args: {
    addingSectionId: 'problem',
    cardDraft: 'A concise customer problem',
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add card' }))
    await expect(args.addCard).toHaveBeenCalledWith('problem')
  },
}

export const BottomPanel: Story = {
  args: {
    bottom: true,
    section: costSection,
  },
  decorators: [
    (Story) => <div className="storybook-bottom-section-frame"><Story /></div>,
  ],
}
