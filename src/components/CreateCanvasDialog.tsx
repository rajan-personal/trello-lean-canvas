import type { Dispatch, SetStateAction } from 'react'
import { Dialog, type CanvasDialogState } from './Dialog'

interface Props {
  dialog: CanvasDialogState | null
  setDialog: Dispatch<SetStateAction<CanvasDialogState | null>>
  onCreate: (name: string) => void
}

export function CreateCanvasDialog({ dialog, setDialog, onCreate }: Props) {
  return (
    <Dialog
      dialog={dialog}
      setDialog={setDialog}
      onSubmit={(current) => {
        const name = current.value.trim()
        if (!name) return
        onCreate(name)
        setDialog(null)
      }}
    />
  )
}
