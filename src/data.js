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

export function createBlankCanvas(name) {
  const trimmedName = name.trim() || 'Imported canvas'
  return {
    id: `${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'canvas'}-${Date.now()}`,
    name: trimmedName,
    title: trimmedName,
    favorite: false,
    sections: sectionTemplate.map((section) => ({ ...section, cards: [] })),
  }
}
