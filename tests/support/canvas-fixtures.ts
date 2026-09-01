import { expect, type Page } from '@playwright/test'
import { dump } from 'js-yaml'
import { sectionTemplate } from '../../src/data/sections'
import type { SectionId } from '../../src/data/types'

type CanvasCards = Partial<Record<SectionId, string[]>>

interface CanvasYamlInput {
  name: string
  title?: string
  cards?: CanvasCards
}

export const sampleCards: CanvasCards = {
  problem: [
    'Decisions disappear across chat, docs, and meetings',
    'Weekly status updates take team leads 2–3 hours',
    'Remote teams cannot see blockers early enough',
  ],
  alternatives: ['Slack threads, spreadsheets, and recurring syncs'],
  solution: [
    'One-minute asynchronous team check-ins',
    'Automatic blocker and decision digest',
    'Shared weekly pulse with clear owners',
  ],
  metrics: ['North star\nTeams completing 3+ check-ins weekly'],
  value: ['Keep every team in sync—without another meeting.'],
  concept: ['The daily stand-up meets a calm team dashboard.'],
  advantage: [
    'Proprietary team-health benchmark',
    'Founder network of remote-first product teams',
  ],
  channels: ['Product-led team invites', 'Remote-work communities'],
  segments: [
    'Remote-first product teams',
    'Product and engineering managers',
    'People leaders',
  ],
  adopters: ['Series A SaaS teams'],
  cost: [
    'Fixed\nProduct team and infrastructure',
    'Variable\nAI summaries and support',
  ],
  revenue: [
    'Team plan\n$8 per member',
    'Business plan\n$14 per member',
    'Annual contracts\n20% off',
  ],
}

function makeCanvasYaml({
  name,
  title = name,
  cards = {},
}: CanvasYamlInput): string {
  return dump({
    canvas: {
      name,
      title,
      sections: sectionTemplate.map((section) => ({
        ...section,
        cards: cards[section.id] ?? [],
      })),
    },
  })
}

export async function uploadCanvas(
  page: Page,
  canvas: CanvasYamlInput,
  fileName = 'canvas.yaml',
): Promise<void> {
  await page.locator('input[type="file"]').setInputFiles({
    name: fileName,
    mimeType: 'application/yaml',
    buffer: Buffer.from(makeCanvasYaml(canvas)),
  })
}

export async function loadSamples(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Load sample data' }).click()
  await expect(page.getByRole('heading', { name: 'Airbnb — 2008' })).toBeVisible()
}

export async function openSampleCanvas(page: Page): Promise<void> {
  await page.goto('/')
  await uploadCanvas(
    page,
    { name: 'Team alignment', title: 'Pulse', cards: sampleCards },
    'team-alignment.yaml',
  )
  await expect(page.getByRole('heading', { name: 'Pulse' })).toBeVisible()
}
