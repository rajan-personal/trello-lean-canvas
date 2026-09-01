import { expect, waitFor, within } from 'storybook/test'
import {
  appMeta,
  blankCanvas,
  SeededApp,
  type AppStory,
} from './App.story-support'
const meta = { ...appMeta, title: 'Screens/LeanCanvasWorkspace' }
export default meta

export const MobileSidebar: AppStory = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const open = canvas.getByRole('button', { name: 'Open sidebar' })
    await expect(open).toBeVisible()
    await userEvent.click(open)
    await expect(
      canvas.getByRole('navigation', { name: 'Lean canvases' }),
    ).toBeVisible()
  },
}
export const CollapsedSidebar: AppStory = {
  parameters: { docs: { story: { autoplay: true } } },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: 'Collapse sidebar' }),
    )
    await expect(
      canvas.getByRole('button', { name: 'Expand sidebar' }),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(
        canvasElement.querySelector('#canvas-sidebar')?.getBoundingClientRect()
          .width,
      ).toBe(0),
    )
  },
}
export const CreateCanvasDialog: AppStory = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Add canvas' }))
    const dialog = canvas.getByRole('dialog', { name: 'Create canvas' })
    await expect(dialog).toBeInTheDocument()
    await expect(
      canvas.getByRole('textbox', { name: 'Canvas name' }),
    ).toHaveFocus()
    await expect(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    ).toHaveStyle({ backgroundColor: 'rgb(241, 242, 244)' })
    await expect(
      within(dialog).getByRole('button', { name: 'Create canvas' }),
    ).toHaveStyle({ backgroundColor: 'rgb(12, 102, 228)' })
  },
}
export const AddCardDraftResume: AppStory = {
  render: () => <SeededApp canvases={[blankCanvas]} />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const section = canvasElement.querySelector(
      '.canvas-column.problem .canvas-cell',
    )
    if (!section) throw new Error('Problem section is missing')
    const cell = within(section as HTMLElement)
    await userEvent.click(cell.getByRole('button', { name: '＋ Add a card' }))
    await userEvent.type(
      cell.getByRole('textbox', { name: 'New card' }),
      'A draft worth keeping',
    )
    await userEvent.click(cell.getByText('Problem'))
    await expect(
      cell.queryByRole('textbox', { name: 'New card' }),
    ).not.toBeInTheDocument()
    await userEvent.click(cell.getByRole('button', { name: '＋ Add a card' }))
    const reopened = cell.getByRole('textbox', { name: 'New card' })
    await expect(reopened).toHaveValue('A draft worth keeping')
    await expect(reopened).toHaveFocus()
    await expect(reopened).toHaveProperty(
      'selectionStart',
      'A draft worth keeping'.length,
    )
    await expect(
      canvas.queryByRole('button', { name: 'Cancel adding card' }),
    ).not.toBeInTheDocument()
  },
}
