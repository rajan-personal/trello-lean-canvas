export type SectionId =
  | 'problem'
  | 'alternatives'
  | 'solution'
  | 'metrics'
  | 'value'
  | 'concept'
  | 'advantage'
  | 'channels'
  | 'segments'
  | 'adopters'
  | 'cost'
  | 'revenue'

export interface CanvasSectionData {
  id: SectionId
  number?: number
  title: string
  hint: string
  cards: string[]
}

export interface LeanCanvas {
  id: string
  name: string
  title: string
  favorite: boolean
  sections: CanvasSectionData[]
}

interface ExampleCanvasDefinition {
  id: string
  name: string
  title: string
  cards: Partial<Record<SectionId, string[]>>
}

export const sectionTemplate: readonly CanvasSectionData[] = [
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

const exampleCanvasDefinitions: ExampleCanvasDefinition[] = [
  {
    id: 'example-airbnb-2008',
    name: 'Airbnb',
    title: 'Airbnb — 2008',
    cards: {
      problem: [
        'Affordable accommodation is hard to find when travelling',
        'Hotels rarely provide an authentic local experience',
        'Homeowners cannot easily monetize vacant space by the night',
        'Home sharing is not yet a familiar habit',
      ],
      alternatives: ['Booking.com', 'Hotels.com'],
      solution: ['An online marketplace where travellers rent affordable local homes and hosts earn from vacant space'],
      metrics: ['Views-to-bookings per host', 'New host applications', 'Net Promoter Score', 'Daily/monthly active users'],
      value: ['Travellers get an affordable, authentic local experience', 'Homeowners earn extra income from unused space'],
      concept: ['Everyone can become a host', 'The sharing economy for accommodation'],
      advantage: ['Any homeowner can supply a place to stay', 'Trust through two-way ratings and host insurance'],
      channels: ['Referrals', 'Recommendations', 'Online and offline advertising'],
      segments: ['Travellers seeking affordable, distinctive accommodation', 'People with spare space who want to host'],
      adopters: ['People ready to share their homes and earn money as hosts'],
      cost: ['Product development and hosting', 'Marketing', 'Payroll', 'Insurance', 'Photography'],
      revenue: ['Booking fees from travellers'],
    },
  },
  {
    id: 'example-facebook-2004',
    name: 'Facebook',
    title: 'Facebook — 2004',
    cards: {
      problem: ['Harvard’s online network has limited functionality and is not fun', 'Students need a simple way to communicate online'],
      alternatives: ['MySpace', 'Hi5', 'Friendster'],
      solution: ['A Harvard-only online network for sharing photos and interests, chatting, and connecting with friends'],
      metrics: ['Daily active users / monthly active users', 'Engagement as the north-star metric'],
      value: ['A student-oriented platform for connecting and sharing with close college friends'],
      concept: ['Friendster for college students'],
      advantage: ['Real-world friendships drive network use', 'A college-focused network with social features'],
      channels: ['Referrals through Harvard student societies', 'Friends at other colleges'],
      segments: ['College students', 'Students at other colleges and universities'],
      adopters: ['Harvard University students'],
      cost: ['Hosting', 'Product development', 'Payroll'],
      revenue: ['Investment', 'Advertising revenue'],
    },
  },
  {
    id: 'example-google-1998',
    name: 'Google',
    title: 'Google — 1998',
    cards: {
      problem: ['Existing search engines return irrelevant results', 'Finding the right web page is difficult'],
      alternatives: ['AltaVista', 'Yahoo', 'Excite'],
      solution: ['A search technology that helps users quickly find relevant web content'],
      metrics: ['Number of search requests', 'Searches completed on the first results page'],
      value: ['Users can find what they are actually looking for', 'Fast, relevant web search'],
      concept: ['Search ranked by the relevance and authority of web pages'],
      advantage: ['PageRank citation-ranking technology'],
      channels: ['User referrals'],
      segments: ['All web users'],
      adopters: ['Stanford students'],
      cost: ['Hosting', 'Product development'],
      revenue: ['Investment', 'Advertising revenue'],
    },
  },
  {
    id: 'example-amazon-1994',
    name: 'Amazon',
    title: 'Amazon — 1994',
    cards: {
      problem: ['There are no broad online bookstores', 'Offline stores make rare books difficult to discover and compare'],
      alternatives: ['Interloc (later Alibris)', 'Local booksellers', 'Barnes & Noble'],
      solution: ['Build an online bookstore with millions of titles'],
      metrics: ['Website traffic', 'Customer acquisition cost', 'Sales conversion rate and revenue per visitor', 'Cart abandonment rate'],
      value: ['Buy a particular book from home without visiting multiple stores'],
      concept: ['Earth’s biggest bookstore'],
      advantage: ['Lower overhead than physical stores', 'No established online bookselling competition'],
      channels: ['Affiliates', 'Resellers'],
      segments: ['Book readers'],
      adopters: ['Customers seeking rare and specialized books', 'Internet users looking for bookselling services'],
      cost: ['Hosting and website development', 'Storage, facilities, and delivery', 'Payroll'],
      revenue: ['Direct book sales'],
    },
  },
]

function createCanvasFromDefinition({ id, name, title, cards }: ExampleCanvasDefinition): LeanCanvas {
  return {
    id,
    name,
    title,
    favorite: false,
    sections: sectionTemplate.map((section) => ({
      ...section,
      cards: [...(cards[section.id] ?? [])],
    })),
  }
}

export function createExampleCanvases(): LeanCanvas[] {
  return exampleCanvasDefinitions.map(createCanvasFromDefinition)
}

export function createBlankCanvas(name: string): LeanCanvas {
  const trimmedName = name.trim() || 'Imported canvas'
  return {
    id: `${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'canvas'}-${Date.now()}`,
    name: trimmedName,
    title: trimmedName,
    favorite: false,
    sections: sectionTemplate.map((section) => ({ ...section, cards: [] })),
  }
}
