import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, waitFor, within } from 'storybook/test'
import { CanvasBoardHarness } from './CanvasBoard.story-support'
import { storyBoardSectionProps, storySections } from './component-story-fixtures'

const meta = {
  title: 'Lean Canvas/CanvasBoard', component: CanvasBoardHarness,
  parameters: { layout: 'fullscreen' },
  args: { sections: storySections.map((section) => ({ ...section, cards: [] })), sectionProps: storyBoardSectionProps },
} satisfies Meta<typeof CanvasBoardHarness>
export default meta
type Story = StoryObj<typeof meta>

export const EverySectionEditable: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const sections = canvasElement.querySelectorAll<HTMLElement>('.canvas-cell')
    await expect(sections).toHaveLength(12)
    for (const [index, element] of Array.from(sections).entries()) {
      const section = within(element)
      await userEvent.click(section.getByRole('button', { name: '＋ Add a card' }))
      const composer = section.getByRole('textbox', { name: 'New card' })
      const top = composer.getBoundingClientRect().top
      fireEvent.change(composer, { target: { value: `Section ${index + 1}` } })
      await userEvent.click(section.getByRole('button', { name: 'Add card' }))
      const card = section.getByRole('button', { name: `Section ${index + 1}` })
      await expect(card.getBoundingClientRect().top).toBe(top)
      await userEvent.dblClick(card)
      fireEvent.change(section.getByRole('textbox', { name: 'Edit card' }), { target: { value: `Updated ${index + 1}\nDetails` } })
      await userEvent.click(section.getByRole('button', { name: 'Save' }))
      const saved = section.getByRole('button', { name: `Updated ${index + 1} Details` })
      await expect(saved).toBeVisible()
      await expect(saved).toHaveFocus()
      await userEvent.click(section.getByRole('button', { name: `Delete “Updated ${index + 1}”` }))
      await expect(section.queryByTitle('Double-click to edit; drag to move')).not.toBeInTheDocument()
    }
  },
}

export const LongContentOnMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { sections: storySections.map((section) => ({ ...section, cards: ['Long heading\n' + 'unbroken'.repeat(60)] })) },
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(320)
    const scroll = canvasElement.querySelector<HTMLElement>('.board-scroll')!
    for (const card of canvasElement.querySelectorAll<HTMLElement>('.card-content')) {
      await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth)
    }
    scroll.scrollLeft = scroll.scrollWidth
    await expect(scroll.scrollLeft).toBeGreaterThan(0)
    await expect(canvasElement.querySelector('.segments')!.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth)
  },
}

export const DragOrdering: Story = {
  args: { sections: storySections.map((section, index) => ({ ...section, cards: index === 0 ? ['First', 'Second'] : [] })) },
  play: async ({ canvasElement }) => {
    const problem = canvasElement.querySelector<HTMLElement>('.problem .canvas-cell')!
    const cost = canvasElement.querySelector<HTMLElement>('.cost .canvas-cell')!
    const dataTransfer = new DataTransfer()
    const first = within(problem).getByRole('button', { name: 'First' }).parentElement!
    fireEvent.dragStart(first, { dataTransfer })
    fireEvent.dragOver(problem, { dataTransfer })
    fireEvent.drop(problem, { dataTransfer })
    await expect(Array.from(problem.querySelectorAll('.card-content'), (card) => card.textContent)).toEqual(['Second', 'First'])
    fireEvent.dragStart(within(problem).getByRole('button', { name: 'First' }).parentElement!, { dataTransfer })
    fireEvent.dragOver(cost, { dataTransfer })
    fireEvent.drop(cost, { dataTransfer })
    await expect(within(cost).getByRole('button', { name: 'First' })).toBeVisible()
    await expect(within(problem).queryByRole('button', { name: 'First' })).not.toBeInTheDocument()
    await waitFor(() => expect(cost.querySelector('.canvas-card-drop-slot')).toHaveStyle({ opacity: '1' }))
  },
}
