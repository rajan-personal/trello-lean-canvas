import { createBoard, type BoardData } from '../../data/board'
import type { AppUser } from '../../auth/auth-context'

export const boardStoryUser: AppUser = {
  uid: 'story-owner', displayName: 'Alex Morgan', email: 'alex@example.test', photoURL: null,
}
export const boardStoryData: BoardData = {
  ...createBoard(),
  cards: [
    { id: 'plan', columnId: 'backlog', title: 'Outline the launch plan', description: 'Start with a small pilot.\nKeep this description off the card front.', rank: 'h' },
    { id: 'research', columnId: 'backlog', title: 'Talk to three early customers', description: '', rank: 'q' },
    { id: 'prototype', columnId: 'in-progress', title: 'Build a focused prototype', description: '', rank: 'h' },
  ],
  comments: [{ id: 'discussion', cardId: 'plan', authorId: boardStoryUser.uid,
    authorName: 'Alex Morgan', text: 'Let’s review the pilot together.', createdAt: '2026-09-04T10:00:00.000Z' }],
}
