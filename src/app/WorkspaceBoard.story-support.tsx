import { useEffect, useState, type ComponentProps } from 'react'
import { WorkspaceBoard } from './WorkspaceBoard'
import { boardStoryData } from '../components/board/board-story-fixtures'
import { applyBoardCommand } from '../data/board-mutations'

export function BoardScreenFixture(args: ComponentProps<typeof WorkspaceBoard>) {
  const [state, setState] = useState(args.state)
  const [deleted, setDeleted] = useState(args.deleted)
  const [closed, setClosed] = useState(false)
  useEffect(() => {
    const remove = () => setDeleted(true)
    window.addEventListener('storybook:delete-canvas', remove)
    return () => window.removeEventListener('storybook:delete-canvas', remove)
  }, [])
  if (closed) return <p role="status" className="bg-white p-3">Deleted canvas closed</p>
  return <div className="h-dvh bg-[#0c66e4]">
    <button className="p-3 text-white" onClick={() => setDeleted(true)}>Simulate remote deletion</button>
    <WorkspaceBoard {...args} deleted={deleted} onDismissDeleted={() => {
      args.onDismissDeleted(); setClosed(true)
    }} state={{ ...state, reload: async () => {
      await args.state.reload()
      setState((value) => ({ ...value, error: null, loading: false, board: structuredClone(boardStoryData) }))
    }, dispatch: async (command) => {
      await args.state.dispatch(command)
      setState((value) => ({ ...value, board: applyBoardCommand(value.board!, command) }))
    } }} />
  </div>
}
