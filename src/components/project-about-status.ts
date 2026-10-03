import { maxAboutTabTitle, maxAboutText } from '../data/canvas-schema'
import type { AboutTab } from '../data/types'

export interface AboutDetails { about: string; aboutTabs: AboutTab[] }

export function aboutProblem(value: AboutDetails) {
  if ([value.about, ...value.aboutTabs.map(({ content }) => content)].some((text) => text.length > maxAboutText))
    return 'Each tab must be 100,000 characters or fewer.'
  if (value.aboutTabs.some(({ title }) => !title.trim())) return 'Every tab needs a name.'
  if (value.aboutTabs.some(({ title }) => title.length > maxAboutTabTitle)) return `Tab names must be ${maxAboutTabTitle} characters or fewer.`
  return null
}

export function aboutSaveStatus(invalid: string | null, failed: boolean, pending: boolean, dirty: boolean) {
  if (invalid) return invalid
  if (failed) return 'Changes could not be saved. Try saving again.'
  if (pending) return 'Saving…'
  return dirty ? 'Unsaved changes' : 'All changes saved'
}
