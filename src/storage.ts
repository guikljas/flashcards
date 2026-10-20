import type { Card } from './types'

const CARDS_KEY = 'revisao-ativa:cards'
const SETTINGS_KEY = 'revisao-ativa:settings'

export const loadCards = (): Card[] => {
  try { return JSON.parse(localStorage.getItem(CARDS_KEY) || '[]') } catch { return [] }
}
export const saveCards = (cards: Card[]) => localStorage.setItem(CARDS_KEY, JSON.stringify(cards))
export const loadSettings = () => {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{"dailyGoal":12,"reminderHour":19}') } catch { return { dailyGoal: 12, reminderHour: 19 } }
}
export const saveSettings = (value: { dailyGoal: number; reminderHour: number }) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(value))
