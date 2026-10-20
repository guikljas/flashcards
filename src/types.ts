export type Card = {
  id: string
  subject: string
  question: string
  answer: string
  nextReview: string
  intervalDays: number
  repetitions: number
  updatedAt: string
  deletedAt?: string
}

export type View = 'home' | 'study' | 'cards' | 'settings'
