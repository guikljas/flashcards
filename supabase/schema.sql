-- Execute este arquivo no SQL Editor do Supabase antes de ativar a sincroniza��o.
create table if not exists public.flashcards (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 1 and 60),
  question text not null check (char_length(question) between 1 and 4000),
  answer text not null check (char_length(answer) between 1 and 4000),
  next_review timestamptz not null default now(),
  interval_days integer not null default 0 check (interval_days >= 0),
  repetitions integer not null default 0 check (repetitions >= 0),
  deleted_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.flashcards enable row level security;
create policy "Cada pessoa gerencia seus cart�es" on public.flashcards
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create index if not exists flashcards_owner_review_idx on public.flashcards (owner_id, next_review);
