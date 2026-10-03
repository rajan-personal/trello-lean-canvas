import { Circle, GitPullRequest, LoaderCircle } from 'lucide-react'

export const ticketStatusIcons = { todo: Circle, 'in-progress': LoaderCircle, review: GitPullRequest } as const
