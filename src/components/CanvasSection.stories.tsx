import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { sectionTemplate, type CanvasSectionData, type SectionId } from '../data'
import { CanvasSection, type CanvasSectionProps, type EditingCard } from './CanvasSection'

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

function CanvasSectionHarness(args: CanvasSectionProps) {
  const [section, setSection] = useState(args.section)
  const [addingSectionId, setAddingSectionId] = useState<SectionId | null>(args.addingSectionId)
  const [cardDraft, setCardDraft] = useState(args.cardDraft)
  const [editingCard, setEditingCard] = useState<EditingCard | null>(args.editingCard)

  return (
    <CanvasSection
      {...args}
      section={section}
      addingSectionId={addingSectionId}
      setAddingSectionId={setAddingSectionId}
      cardDraft={cardDraft}
      setCardDraft={setCardDraft}
      editingCard={editingCard}
      setEditingCard={setEditingCard}
      startAddingCard={(sectionId) => {
        args.startAddingCard(sectionId)
        setEditingCard(null)
        setAddingSectionId(sectionId)
      }}
      addCard={(sectionId) => {
        args.addCard(sectionId)
        const text = cardDraft.trim()
        if (!text) return
        setSection((current) => ({ ...current, cards: [...current.cards, text] }))
        setCardDraft('')
        setAddingSectionId(null)
      }}
      editCard={(sectionId, index, value) => {
        args.editCard(sectionId, index, value)
        setAddingSectionId(null)
        setEditingCard({ sectionId, index, value })
      }}
      deleteCard={(sectionId, index) => {
        args.deleteCard(sectionId, index)
        setSection((current) => ({ ...current, cards: current.cards.filter((_, cardIndex) => cardIndex !== index) }))
      }}
      saveEditedCard={() => {
        args.saveEditedCard()
        const value = editingCard?.value.trim()
        if (!editingCard || !value) return
        setSection((current) => ({
          ...current,
          cards: current.cards.map((card, index) => index === editingCard.index ? value : card),
        }))
        setEditingCard(null)
      }}
    />
  )
}

const meta = {
  title: 'Lean Canvas/CanvasSection',
  component: CanvasSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A stateful Lean Canvas cell covering empty, populated, composing, editing, and bottom-panel states.',
      },
    },
  },
  decorators: [
    (Story, context) => (
      <div
        className={context.args.bottom
          ? 'storybook-bottom-section-frame flex h-[260px] w-[620px] overflow-hidden rounded-xl bg-[#f1f2f4] text-[#172b4d]'
          : 'storybook-section-frame flex h-[520px] w-[300px] overflow-hidden rounded-xl bg-[#f1f2f4] text-[#172b4d]'}
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
    dragHandlers: {
      onDrop: fn(),
      onDragStart: fn(),
      onDragEnd: fn(),
    },
  },
  render: (args) => (
    <CanvasSectionHarness
      key={JSON.stringify([args.section, args.bottom, args.addingSectionId, args.cardDraft, args.editingCard])}
      {...args}
    />
  ),
} satisfies Meta<typeof CanvasSection>

export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getAllByTitle('Double-click to edit; drag to move')).toHaveLength(3)
    await expect(canvas.getByText('Problem')).toBeInTheDocument()
    await expect(canvas.queryByText('1.')).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Clear Problem' })).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: '＋ Add a card' }))
    await expect(args.startAddingCard).toHaveBeenCalledWith('problem')
  },
}

export const Empty: Story = {
  args: { section: { ...problemSection, cards: [] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('List your top 1–3 problems.')).toBeInTheDocument()
  },
}

export const Composing: Story = {
  args: {
    addingSectionId: 'problem',
    cardDraft: 'A concise customer problem',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'New card' })).toHaveValue('A concise customer problem')
    await expect(canvas.getByRole('button', { name: 'Add card' })).toHaveStyle({ minHeight: '28px', fontSize: '12px' })
  },
}

export const SubmitCard: Story = {
  args: {
    addingSectionId: 'problem',
    cardDraft: 'A concise customer problem',
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add card' }))
    await expect(args.addCard).toHaveBeenCalledWith('problem')
    await expect(canvas.getByRole('button', { name: 'A concise customer problem' })).toBeInTheDocument()
  },
}

export const Editing: Story = {
  args: {
    editingCard: { sectionId: 'problem', index: 0, value: 'A clearer customer problem' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Edit card' })).toHaveValue('A clearer customer problem')
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}

export const SaveEdit: Story = {
  args: {
    editingCard: { sectionId: 'problem', index: 0, value: 'A clearer customer problem' },
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(args.saveEditedCard).toHaveBeenCalledOnce()
    await expect(canvas.getByRole('button', { name: 'A clearer customer problem' })).toBeInTheDocument()
  },
}

export const BottomPanel: Story = {
  args: {
    bottom: true,
    section: costSection,
  },
}
