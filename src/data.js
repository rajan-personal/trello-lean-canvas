export const sectionTemplate = [
  { id: 'problem', number: 1, title: 'Problem', hint: 'List your top 1–3 problems.', cards: [] },
  { id: 'alternatives', title: 'Existing alternatives', hint: 'How are these problems solved today?', cards: [] },
  { id: 'solution', number: 4, title: 'Solution', hint: 'Outline a possible solution for each problem.', cards: [] },
  { id: 'metrics', title: 'Key metrics', hint: 'How will you measure success?', cards: [] },
  { id: 'value', number: 3, title: 'Unique value proposition', hint: 'Single, clear, compelling message that states why you are different.', cards: [] },
  { id: 'concept', title: 'High-level concept', hint: 'List your X for Y analogy.', cards: [] },
  { id: 'advantage', number: 9, title: 'Unfair advantage', hint: 'Something that cannot easily be bought or copied.', cards: [] },
  { id: 'channels', title: 'Channels', hint: 'Your path to customers.', cards: [] },
  { id: 'segments', number: 2, title: 'Customer segments', hint: 'List your target customers and users.', cards: [] },
  { id: 'adopters', title: 'Early adopters', hint: 'The characteristics of your ideal customers.', cards: [] },
  { id: 'cost', number: 7, title: 'Cost structure', hint: 'List your fixed and variable costs.', cards: [] },
  { id: 'revenue', number: 8, title: 'Revenue streams', hint: 'List your sources of revenue.', cards: [] },
]

const makeSections = (cards) => sectionTemplate.map((section) => ({
  ...section,
  cards: cards[section.id] ?? [],
}))

export const initialCanvases = [
  {
    id: 'team-alignment',
    name: 'Team alignment',
    title: 'Lean Canvas — Pulse',
    favorite: false,
    sections: makeSections({
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
      value: [
        'Keep every team in sync—without another meeting.',
        'Pulse turns quick check-ins into a shared view of progress.',
      ],
      concept: ['The daily stand-up meets a calm team dashboard.'],
      advantage: [
        'Proprietary team-health benchmark built from anonymized patterns',
        'Founder network of 40 remote-first product teams',
      ],
      channels: [
        'Product-led team invites and shared pulse links',
        'Remote-work communities and operator newsletters',
      ],
      segments: [
        'Remote-first product teams with 10–100 people',
        'Product and engineering managers running 2+ squads',
        'People leaders tracking team health',
      ],
      adopters: ['Series A SaaS teams scaling across time zones'],
      cost: [
        'Fixed\nProduct team, infrastructure, security, and compliance',
        'Variable\nAI summaries, success, and payment processing',
      ],
      revenue: [
        'Team plan\n$8 per active member / month',
        'Business plan\n$14 per member with SSO and analytics',
        'Annual contracts\n20% off for 100+ seat teams',
      ],
    }),
  },
  {
    id: 'new-market-entry',
    name: 'New market entry',
    title: 'Lean Canvas — Atlas',
    favorite: false,
    sections: makeSections({
      problem: ['Expansion research is scattered across teams', 'Local buying signals arrive too late', 'Market launches repeat the same mistakes'],
      alternatives: ['Consultancies, analyst reports, and manual spreadsheets'],
      solution: ['Shared market scorecards', 'Live regulatory and demand signals', 'Reusable launch playbooks'],
      metrics: ['North star\nMarkets reaching qualified pipeline in 90 days'],
      value: ['Know where to expand—and what to do next.', 'Atlas turns fragmented market evidence into a confident launch plan.'],
      concept: ['A mission control center for international expansion.'],
      advantage: ['Localized signal dataset across 28 markets', 'Operator network with firsthand launch experience'],
      channels: ['Founder communities and expansion partners', 'Product-led market readiness assessment'],
      segments: ['B2B SaaS companies entering a second region', 'Strategy teams validating expansion bets', 'Revenue leaders building local pipeline'],
      adopters: ['Series B companies with repeatable domestic growth'],
      cost: ['Fixed\nResearch, data partnerships, and product team', 'Variable\nMarket feeds and local expert reviews'],
      revenue: ['Growth plan\n$499 per market / month', 'Enterprise plan\nCustom portfolios and governance', 'Launch sprint\n$4,800 one-time engagement'],
    }),
  },
  {
    id: 'mobile-onboarding',
    name: 'Mobile onboarding',
    title: 'Lean Canvas — Firstmile',
    favorite: false,
    sections: makeSections({
      problem: ['New users abandon setup before the first success', 'Generic tours hide the next best action', 'Teams cannot explain why activation drops'],
      alternatives: ['Static product tours and one-size-fits-all checklists'],
      solution: ['Adaptive onboarding paths', 'Contextual guidance inside real tasks', 'Friction replay with clear recommendations'],
      metrics: ['North star\nUsers reaching first value in under 4 minutes'],
      value: ['Turn every first session into forward motion.', 'Firstmile adapts onboarding to what each user is trying to achieve.'],
      concept: ['A GPS for the first five minutes of your product.'],
      advantage: ['Cross-product activation benchmark', 'Privacy-safe mobile interaction model'],
      channels: ['Mobile product communities', 'SDK marketplace and developer referrals'],
      segments: ['Consumer subscription apps', 'Mobile product and growth teams', 'Developers owning activation funnels'],
      adopters: ['Seed to Series B apps with 20k+ monthly installs'],
      cost: ['Fixed\nSDK, analytics, product, and privacy engineering', 'Variable\nEvent processing and experiment traffic'],
      revenue: ['Starter\nFree for 5k monthly users', 'Scale\n$299 per 50k monthly users', 'Enterprise\nCustom data controls and support'],
    }),
  },
]

export function createBlankCanvas(name) {
  const trimmedName = name.trim() || 'Untitled canvas'
  return {
    id: `${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'canvas'}-${Date.now()}`,
    name: trimmedName,
    title: `Lean Canvas — ${trimmedName}`,
    favorite: false,
    sections: makeSections({}),
  }
}

