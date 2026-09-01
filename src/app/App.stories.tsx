import { expect, within } from 'storybook/test'
import {
  appMeta,
  blankCanvas,
  SeededApp,
  type AppStory,
} from './App.story-support'
const meta = { ...appMeta, title: 'Screens/LeanCanvasWorkspace' }
export default meta

export const Default: AppStory = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryAllByRole('heading')).toHaveLength(0)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Load sample data' }),
    )
    await expect(
      await canvas.findByRole('heading', { name: 'Airbnb — 2008' }),
    ).toBeInTheDocument()
    await expect(
      canvas.getByText('Booking fees from travellers'),
    ).toBeInTheDocument()
    await expect(
      canvas.getByRole('button', { name: 'Load sample data' }),
    ).toBeInTheDocument()
    await expect(
      canvas.getByRole('button', { name: 'Add canvas' }),
    ).toBeInTheDocument()
  },
}
export const BlankCanvas: AppStory = {
  render: () => <SeededApp canvases={[blankCanvas]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { name: 'Blank canvas' }),
    ).toBeInTheDocument()
    await expect(canvasElement.querySelectorAll('.cell-hint')).toHaveLength(12)
    const grid = canvasElement.querySelector('.lean-grid')
    const board = canvasElement.querySelector('.board-scroll')
    if (!(grid instanceof HTMLElement) || !(board instanceof HTMLElement))
      throw new Error('Blank canvas layout is incomplete')
    const styles = getComputedStyle(board)
    const height =
      board.clientHeight -
      Number.parseFloat(styles.paddingTop) -
      Number.parseFloat(styles.paddingBottom)
    await expect(grid.getBoundingClientRect().height).toBeCloseTo(height, 1)
  },
}
export const ReorderedSidebar: AppStory = {
  render: () => <SeededApp samples reordered />,
  play: async ({ canvasElement }) => {
    const navigation = await within(canvasElement).findByRole('navigation', {
      name: 'Lean canvases',
    })
    const buttons = await within(navigation).findAllByRole('button')
    await expect(buttons[0]).toHaveAccessibleName('Facebook')
    await expect(buttons[1]).toHaveAccessibleName('Airbnb')
  },
}
