import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { BoardCardDialog } from './BoardCardDialog'
import { boardStoryData, boardStoryUser } from './board-story-fixtures'
import './kanban.css'

const meta = {
  title: 'Kanban/Card details', component: BoardCardDialog, tags: ['autodocs'],
  args: { card: boardStoryData.cards[0], board: boardStoryData, user: boardStoryUser,
    pending: false, error: null, run: fn(async () => true), onClose: fn(), register: () => () => undefined },
} satisfies Meta<typeof BoardCardDialog>
export default meta
type Story = StoryObj<typeof meta>
export const Discussion: Story = {}
export const EmptyDiscussion: Story = { args: { card: boardStoryData.cards[1] } }
export const MobileDiscussion: Story = { globals: { viewport: { value: 'mobile1', isRotated: false } } }
export const LongDiscussion: Story = { args: { board: { ...boardStoryData,
  comments: Array.from({ length: 8 }, (_, index) => ({ ...boardStoryData.comments[0], id: `comment-${index}`,
    authorName: index % 2 ? 'Sam Rivera' : 'Alex Morgan',
    text: index % 2 ? 'Agreed. Let’s keep the first milestone small and review what we learn.' : 'The pilot is ready for a closer look.\nWhat should we test first?' })) } } }
export const Saving: Story = { args: { pending: true } }
export const SaveFailure: Story = { args: { error: 'Changes could not be saved. Your draft is still here.', run: fn(async () => false) } }
export const LongPlainText: Story = { args: { card: { ...boardStoryData.cards[0],
  title: 'A long card title that wraps across lines without icons, badges, or hidden metadata',
  description: '<strong>This is plain text, not HTML.</strong>\n\n' + 'A detailed note. '.repeat(100) } } }

export const DeletedCanvas: Story = { args: { deleted: true } }
