import { createElement } from 'react'
import { AddonPanel } from 'storybook/internal/components'
import { addons, types } from 'storybook/manager-api'
import { CommentsPanel } from './CommentsPanel.jsx'

const ADDON_ID = 'local-component-comments'
const PANEL_ID = `${ADDON_ID}/panel`

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Comments',
    render: ({ active }) => createElement(
      AddonPanel,
      { active },
      createElement(CommentsPanel),
    ),
  })
})
