import { createBlankCanvas } from './factories'
import type { LeanCanvas } from './types'
import { yamlToCanvas } from './yaml'

const exampleFiles = import.meta.glob<string>('../../examples/*.yaml', {
  import: 'default',
  query: '?raw',
})

export async function loadExampleCanvases(): Promise<LeanCanvas[]> {
  const files = Object.entries(exampleFiles).sort(([left], [right]) =>
    left.localeCompare(right),
  )
  return Promise.all(
    files.map(async ([path, load]) => ({
      ...yamlToCanvas(await load(), createBlankCanvas('Sample canvas')),
      id: `sample-${path.split('/').pop()?.replace(/\.ya?ml$/i, '')}`,
    })),
  )
}
