export const workspaceViews = ['board', 'canvas', 'about'] as const
export type WorkspaceView = typeof workspaceViews[number]
