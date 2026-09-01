import { expect, fn } from 'storybook/test'
import { sectionTemplate } from '../data.js'
import { CanvasSection } from './CanvasSection.jsx'

const problemSection = {
  ...sectionTemplate.find((section) => section.id === 'problem'),
  cards: [
    'Decisions disappear across chat, docs, and meetings',
    'Weekly status updates take team leads 2–3 hours',
    'Remote teams cannot see blockers early enough',
  ],
}

const costSection = {
  ...sectionTemplate.find((section) => section.id === 'cost'),
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
    setAddingSectionId: fn(),
    setCardDraft: fn(),
    addCard: fn(),
    editCard: fn(),
    clearSection: fn(),
    dragHandlers: {
      onDrop: fn(),
      onDragStart: fn(),
      onDragEnd: fn(),
    },
  },
}

export default meta

export const Populated = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getAllByTitle('Click to edit; drag to move')).toHaveLength(3)
    await userEvent.click(canvas.getByRole('button', { name: '＋ Add a card' }))
    await expect(args.setAddingSectionId).toHaveBeenCalledWith('problem')
  },
}

export const Empty = {
  args: {
    section: { ...problemSection, cards: [] },
  },
}

export const Composing = {
  args: {
    addingSectionId: 'problem',
    cardDraft: 'A concise customer problem',
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add card' }))
    await expect(args.addCard).toHaveBeenCalledWith('problem')
  },
}

export const BottomPanel = {
  args: {
    bottom: true,
    section: costSection,
  },
  decorators: [
    (Story) => <div className="storybook-bottom-section-frame"><Story /></div>,
  ],
}
