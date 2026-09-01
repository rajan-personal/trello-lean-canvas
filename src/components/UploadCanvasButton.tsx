import { useRef, type ChangeEvent } from 'react'
import { Upload } from 'lucide-react'
import { ToolbarIconButton } from './ToolbarIconButton'

export function UploadCanvasButton({
  onImport,
}: {
  onImport: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <ToolbarIconButton
        label="Upload another canvas from YAML"
        title="Upload YAML"
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={17} />
      </ToolbarIconButton>
      <input
        ref={inputRef}
        className="file-input hidden"
        type="file"
        accept=".yaml,.yml,text/yaml,application/yaml"
        aria-label="Upload canvas YAML file"
        onChange={onImport}
      />
    </>
  )
}
