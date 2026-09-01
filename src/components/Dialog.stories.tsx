import { expect } from 'storybook/test'
import { dialogMeta, type DialogStory } from './Dialog.story-support'

const meta = { ...dialogMeta, title: 'Lean Canvas/Dialog' }
export default meta

export const Open: DialogStory = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('dialog', { name: 'Create canvas' }),
    ).toBeInTheDocument()
    await expect(
      canvas.getByRole('textbox', { name: 'Canvas name' }),
    ).toHaveFocus()
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toHaveStyle({
      backgroundColor: 'rgb(241, 242, 244)',
    })
    await expect(
      canvas.getByRole('button', { name: 'Create canvas' }),
    ).toHaveStyle({ backgroundColor: 'rgb(12, 102, 228)' })
  },
}
