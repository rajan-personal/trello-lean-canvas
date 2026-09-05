import { useState, type ComponentProps } from 'react'
import { CanvasAddMenu } from './CanvasAddMenu'

export function CanvasAddMenuHarness(args: ComponentProps<typeof CanvasAddMenu>) {
  const [result, setResult] = useState('')
  return <><CanvasAddMenu {...args}
    onNew={() => { args.onNew(); setResult('New canvas requested') }}
    onLoadSamples={() => { args.onLoadSamples(); setResult('Samples requested') }}
    onImport={(event) => { args.onImport(event); setResult(event.target.files?.[0]?.name ?? '') }} />
    <output className="sr-only">{result}</output></>
}
