import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { abovePhoneQuery, dockedQuery, drawerQuery, phoneQuery } from '../src/lib/breakpoints'

const styles = readFileSync('src/styles.css', 'utf8')
const files = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name)
  return statSync(path).isDirectory() ? files(path) : [path]
})
const sources = files('src').filter((path) => /\.(css|tsx?)$/.test(path) && !path.includes('.stories.'))

describe('layout tiers', () => {
  it.each([
    ['phone', phoneQuery],
    ['above-phone', abovePhoneQuery],
    ['drawer', drawerQuery],
    ['docked', dockedQuery],
  ])('Tailwind %s variant matches breakpoints.ts', (name, query) => {
    expect(styles).toContain(`@custom-variant ${name} {\n  @media ${query} { @slot; }\n}`)
  })

  it('raw CSS media rules use the shared tier queries', () => {
    for (const path of sources.filter((p) => p.endsWith('.css'))) {
      for (const [, query] of readFileSync(path, 'utf8').matchAll(/^\s*@media ([^{;]*?(?:min|max)-width[^{;]*?)\s*\{/gm))
        expect([phoneQuery, abovePhoneQuery, drawerQuery, dockedQuery, '(max-width: 360px)'], path).toContain(query.trim())
    }
  })

  it('components use tier variants instead of ad-hoc width breakpoints', () => {
    const offenders = sources.filter((path) => /\b(?:max|min)-\[\d+px\]:/.test(readFileSync(path, 'utf8')))
    expect(offenders).toEqual([])
  })
})
