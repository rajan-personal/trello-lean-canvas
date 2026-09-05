import { useState, type ComponentProps } from 'react'
import { BoardTitle } from './BoardTitle'

export function BoardTitleHarness(args: ComponentProps<typeof BoardTitle>) {
  const [canvas, setCanvas] = useState(args.canvas)
  return <BoardTitle canvas={canvas} onRename={(name) => {
    args.onRename(name)
    setCanvas((current) => ({ ...current, name, title: name }))
  }} />
}
