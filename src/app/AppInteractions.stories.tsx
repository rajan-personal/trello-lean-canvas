import { expect, fireEvent, waitFor, within } from 'storybook/test'
import { appMeta, blankCanvas, SeededApp, type AppStory } from './App.story-support'
const meta = { ...appMeta, title: 'Screens/LeanCanvasWorkspace' }
export default meta
export const MobileSidebar: AppStory = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  render: () => <SeededApp canvases={[blankCanvas]} />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const open = await canvas.findByRole('button', { name: 'Open sidebar' })
    await expect(open).toBeVisible()
    await userEvent.click(open)
    await expect(
      canvas.getByRole('navigation', { name: 'Lean canvases' }),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Notepad' }))
    await expect(open).toHaveAttribute('aria-expanded', 'false')
    await expect(canvasElement.querySelector('.sidebar-scrim')).not
      .toBeInTheDocument()
    const notes = await canvas.findByRole('textbox', { name: 'Canvas notes' })
    await waitFor(() => expect(notes).toBeVisible())
    const notepadBounds = canvas.getByRole('complementary', { name: 'Notepad' })
      .getBoundingClientRect()
    await expect([notepadBounds.left, notepadBounds.right]).toEqual([
      0, window.innerWidth,
    ])
  },
}
export const CollapsedSidebar: AppStory = {
  parameters: { docs: { story: { autoplay: true } } },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Collapse sidebar' }),
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
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Add canvas' }),
    )
    await userEvent.click(
      canvas.getByRole('button', { name: /^New$/ }),
    )
    const dialog = await canvas.findByRole('dialog', { name: 'Create canvas' })
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
    await canvas.findByRole('heading', { name: 'Blank canvas' })
    const section = canvasElement.querySelector(
      '.canvas-column.problem .canvas-cell',
    )
    if (!section) throw new Error('Problem section is missing')
    const cell = within(section as HTMLElement)
    await userEvent.click(cell.getByRole('button', { name: '＋ Add a card' }))
    fireEvent.change(cell.getByRole('textbox', { name: 'New card' }), {
      target: { value: 'A draft worth keeping' },
    })
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
