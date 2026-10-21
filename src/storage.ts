import type { Card } from './types'

const CARDS_KEY = 'revisao-ativa:cards'
const SETTINGS_KEY = 'revisao-ativa:settings'

export const loadCards = (): Card[] => {
  try {
    const stored = JSON.parse(localStorage.getItem(CARDS_KEY) || '[]')
    return Array.isArray(stored) ? stored.filter(isCard) : []
  } catch { return [] }
}
export const saveCards = (cards: Card[]) => localStorage.setItem(CARDS_KEY, JSON.stringify(cards))
export const loadSettings = () => {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{"dailyGoal":12,"reminderHour":19}') } catch { return { dailyGoal: 12, reminderHour: 19 } }
}
export const saveSettings = (value: { dailyGoal: number; reminderHour: number }) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(value))

const isCard = (value: unknown): value is Card => {
  if (!value || typeof value !== 'object') return false
  const card = value as Partial<Card>
  return typeof card.id === 'string' && typeof card.subject === 'string' && typeof card.question === 'string' &&
    typeof card.answer === 'string' && typeof card.nextReview === 'string' && typeof card.intervalDays === 'number' &&
    typeof card.repetitions === 'number' && typeof card.updatedAt === 'string'
}
