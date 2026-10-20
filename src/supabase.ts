import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Card } from './types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

type DbCard = {
  id: string; subject: string; question: string; answer: string; next_review: string
  interval_days: number; repetitions: number; updated_at: string; deleted_at: string | null
}
const fromDb = (card: DbCard): Card => ({
  id: card.id, subject: card.subject, question: card.question, answer: card.answer,
  nextReview: card.next_review, intervalDays: card.interval_days, repetitions: card.repetitions,
  updatedAt: card.updated_at, deletedAt: card.deleted_at || undefined,
})
const toDb = (card: Card, ownerId: string) => ({
  id: card.id, owner_id: ownerId, subject: card.subject, question: card.question, answer: card.answer,
  next_review: card.nextReview, interval_days: card.intervalDays, repetitions: card.repetitions,
  updated_at: card.updatedAt, deleted_at: card.deletedAt || null,
})

export async function syncCards(local: Card[], ownerId: string): Promise<Card[]> {
  if (!supabase) return local
  const { data: remote, error: remoteError } = await supabase.from('flashcards').select('*')
  if (remoteError) throw remoteError
  const remoteCards = (remote as DbCard[]).map(fromDb)
  const merged = new Map<string, Card>()
  for (const card of [...local, ...remoteCards]) {
    const previous = merged.get(card.id)
    if (!previous || Date.parse(card.updatedAt) > Date.parse(previous.updatedAt)) merged.set(card.id, card)
  }
  const all = [...merged.values()]
  const { error: uploadError } = await supabase.from('flashcards').upsert(all.map(card => toDb(card, ownerId)))
  if (uploadError) throw uploadError
  return all
}
