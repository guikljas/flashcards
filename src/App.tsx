import { useEffect, useMemo, useState } from 'react'
import { Bell, BookOpen, Check, ChevronLeft, ChevronRight, Cloud, CloudOff, GraduationCap, Home, Layers, LogIn, Plus, Settings, X } from 'lucide-react'
import { loadCards, loadSettings, saveCards, saveSettings } from './storage'
import { supabase, syncCards } from './supabase'
import type { Card, View } from './types'

const subjectColors: Record<string, string> = { Matemática: '#7876e8', Física: '#e57c55', Química: '#44ac94', Biologia: '#63ad67', História: '#c98e42' }
const dateLabel = (date: string) => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(new Date(date))
const newId = () => crypto.randomUUID()
const now = () => new Date().toISOString()
const isDue = (card: Card) => !card.deletedAt && Date.parse(card.nextReview) <= Date.now()
const intervals = [1, 3, 7, 14, 30, 60]

export default function App() {
  const [view, setView] = useState<View>('home')
  const [cards, setCards] = useState<Card[]>(loadCards)
  const [settings, setSettings] = useState(loadSettings)
  const [subject, setSubject] = useState('Todas')
  const [showCreate, setShowCreate] = useState(false)
  const [studyIndex, setStudyIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [syncState, setSyncState] = useState<'local' | 'syncing' | 'synced' | 'error'>('local')

  const activeCards = useMemo(() => cards.filter(card => !card.deletedAt), [cards])
  const dueCards = useMemo(() => activeCards.filter(isDue), [activeCards])
  const subjects = useMemo(() => ['Todas', ...Array.from(new Set(activeCards.map(card => card.subject))).sort()], [activeCards])
  const filteredDue = useMemo(() => dueCards.filter(card => subject === 'Todas' || card.subject === subject), [dueCards, subject])
  const studiedToday = useMemo(() => activeCards.filter(card => card.repetitions > 0 && new Date(card.updatedAt).toDateString() === new Date().toDateString()).length, [activeCards])

  useEffect(() => saveCards(cards), [cards])
  useEffect(() => saveSettings(settings), [settings])
  useEffect(() => {
    const listener = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent) }
    window.addEventListener('beforeinstallprompt', listener)
    return () => window.removeEventListener('beforeinstallprompt', listener)
  }, [])
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null))
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => setUserEmail(session?.user.email ?? null))
    return () => subscription.subscription.unsubscribe()
  }, [])
  useEffect(() => { if (userEmail) void sync() }, [userEmail]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const maybeRemind = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return
      const today = new Date().toDateString()
      const sentKey = 'revisao-ativa:last-reminder'
      if (new Date().getHours() < settings.reminderHour || localStorage.getItem(sentKey) === today || !dueCards.length) return
      new Notification('Hora da sua revisão', { body: `Você tem ${dueCards.length} flashcard${dueCards.length > 1 ? 's' : ''} esperando.`, icon: '/icon.svg' })
      localStorage.setItem(sentKey, today)
    }
    maybeRemind()
    const timer = window.setInterval(maybeRemind, 60_000)
    return () => window.clearInterval(timer)
  }, [dueCards.length, settings.reminderHour])

  async function sync() {
    if (!supabase) return
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    try { setSyncState('syncing'); const merged = await syncCards(cards, data.user.id); setCards(merged); setSyncState('synced') }
    catch { setSyncState('error') }
  }
  function addCard(data: Pick<Card, 'subject' | 'question' | 'answer'>) {
    const card: Card = { id: newId(), ...data, nextReview: now(), intervalDays: 0, repetitions: 0, updatedAt: now() }
    setCards(current => [card, ...current]); setShowCreate(false); if (userEmail) setTimeout(() => void sync(), 50)
  }
  function rate(card: Card, quality: 'again' | 'hard' | 'good') {
    const interval = quality === 'again' ? 0 : quality === 'hard' ? Math.max(1, Math.ceil(card.intervalDays * 1.4)) : intervals[Math.min(card.repetitions, intervals.length - 1)]
    const next = new Date(); next.setDate(next.getDate() + interval)
    setCards(current => current.map(item => item.id === card.id ? { ...item, intervalDays: interval, repetitions: quality === 'again' ? 0 : item.repetitions + 1, nextReview: next.toISOString(), updatedAt: now() } : item))
    setFlipped(false); setStudyIndex(index => index + 1); if (userEmail) setTimeout(() => void sync(), 50)
  }
  function removeCard(card: Card) { setCards(current => current.map(item => item.id === card.id ? { ...item, deletedAt: now(), updatedAt: now() } : item)); if (userEmail) setTimeout(() => void sync(), 50) }
  async function requestNotifications() {
    if (!('Notification' in window)) return alert('Este navegador não oferece notificações.')
    const permission = await Notification.requestPermission()
    if (permission === 'granted') new Notification('Lembretes ativados', { body: 'Voltaremos a te lembrar de revisar seus cartões.' })
  }
  async function install() { if (!installPrompt) return; await installPrompt.prompt(); setInstallPrompt(null) }

  return <main className="shell">
    <header className="topbar"><div className="brand"><span className="brand-icon"><Layers size={19}/></span><div><strong>Mente em Dia</strong><small>Estude. Lembre. Domine.</small></div></div><div className="header-actions">{syncState === 'synced' ? <span className="sync ok"><Cloud size={16}/> Sincronizado</span> : syncState === 'syncing' ? <span className="sync"><Cloud size={16}/> Salvando</span> : <span className="sync"><CloudOff size={16}/> Local</span>}<button className="avatar" onClick={() => setView('settings')} aria-label="Abrir configurações">{userEmail?.[0]?.toUpperCase() || 'G'}</button></div></header>
    <section className="page">
      {view === 'home' && <HomePage due={dueCards.length} active={activeCards.length} studied={studiedToday} goal={settings.dailyGoal} setView={setView} setShowCreate={setShowCreate} subjects={subjects.slice(1)} cards={activeCards} onSubject={(name) => { setSubject(name); setStudyIndex(0); setView('study') }} onInstall={installPrompt ? install : undefined} />}
      {view === 'study' && <StudyPage cards={filteredDue} subject={subject} setSubject={setSubject} subjects={subjects} cardIndex={studyIndex} flipped={flipped} setFlipped={setFlipped} onRate={rate} onBack={() => setView('home')} />}
      {view === 'cards' && <CardsPage cards={activeCards} onDelete={removeCard} onCreate={() => setShowCreate(true)} />}
      {view === 'settings' && <SettingsPage settings={settings} setSettings={setSettings} userEmail={userEmail} onLogin={async (email, password) => { if (!supabase) return alert('Configure o Supabase primeiro. Veja o README.'); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) alert(error.message) }} onRegister={async (email, password) => { if (!supabase) return alert('Configure o Supabase primeiro. Veja o README.'); const { error } = await supabase.auth.signUp({ email, password }); if (error) alert(error.message); else alert('Conta criada. Verifique seu e-mail se o Supabase pedir confirmação.') }} onLogout={() => void supabase?.auth.signOut()} onNotifications={requestNotifications} supabaseReady={Boolean(supabase)} />}
    </section>
    <nav className="bottom-nav"><NavButton icon={<Home/>} label="Início" selected={view === 'home'} onClick={() => setView('home')} /><NavButton icon={<BookOpen/>} label="Estudar" selected={view === 'study'} onClick={() => { setStudyIndex(0); setView('study') }} /><button className="add-button" onClick={() => setShowCreate(true)} aria-label="Criar flashcard"><Plus/></button><NavButton icon={<Layers/>} label="Cartões" selected={view === 'cards'} onClick={() => setView('cards')} /><NavButton icon={<Settings/>} label="Ajustes" selected={view === 'settings'} onClick={() => setView('settings')} /></nav>
    {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={addCard} />}
  </main>
}

function HomePage({ due, active, studied, goal, setView, setShowCreate, subjects, cards, onSubject, onInstall }: { due: number; active: number; studied: number; goal: number; setView: (view: View) => void; setShowCreate: (value: boolean) => void; subjects: string[]; cards: Card[]; onSubject: (name: string) => void; onInstall?: () => void }) {
  const progress = Math.min(100, Math.round((studied / goal) * 100))
  return <><div className="hero"><div><p className="eyebrow">SEU RITMO DE HOJE</p><h1>Pequenas revisões,<br/><em>grande memória.</em></h1><p className="muted">{due ? `${due} cartões estão prontos para você.` : 'Você está em dia. Bom trabalho!'}</p><button className="primary" onClick={() => setView('study')}>{due ? 'Começar revisão' : 'Ver cartões'} <ChevronRight size={18}/></button></div><div className="hero-orb"><strong>{due}</strong><span>para revisar</span></div></div>
  <div className="stats"><article><span>Meta diária</span><strong>{studied}<i>/{goal}</i></strong><div className="bar"><i style={{ width: `${progress}%` }}/></div></article><article><span>Cartões criados</span><strong>{active}</strong><small>em todas as matérias</small></article><article className="tip"><GraduationCap/><span>Dica de hoje</span><p>Revisar pouco e sempre fixa mais do que uma maratona.</p></article></div>
  <section className="section-title"><div><p className="eyebrow">SUAS MATÉRIAS</p><h2>Estude por assunto</h2></div><button className="text-button" onClick={() => setShowCreate(true)}>+ novo cartão</button></section>
  <div className="subject-grid">{subjects.length ? subjects.map(name => { const count = cards.filter(card => card.subject === name).length; return <button className="subject-card" onClick={() => onSubject(name)} key={name}><span className="subject-dot" style={{ background: subjectColors[name] || '#7895e8' }}/><strong>{name}</strong><small>{count} cartões</small><ChevronRight size={18}/></button> }) : <EmptyState text="Crie seu primeiro flashcard e ele aparecerá aqui." />}</div>
  {onInstall && <button className="install" onClick={onInstall}><Plus size={17}/> Instalar na tela inicial</button>}</>
}
function StudyPage({ cards, subject, setSubject, subjects, cardIndex, flipped, setFlipped, onRate, onBack }: { cards: Card[]; subject: string; setSubject: (value: string) => void; subjects: string[]; cardIndex: number; flipped: boolean; setFlipped: (value: boolean) => void; onRate: (card: Card, quality: 'again' | 'hard' | 'good') => void; onBack: () => void }) {
  const card = cards[cardIndex % Math.max(cards.length, 1)]
  if (!cards.length) return <div className="empty-study"><button className="back" onClick={onBack}><ChevronLeft/> Voltar</button><Check size={42}/><h1>Revisões em dia!</h1><p>Não há cartões pendentes neste filtro.</p></div>
  return <><button className="back" onClick={onBack}><ChevronLeft/> Início</button><div className="study-head"><select value={subject} onChange={event => { setSubject(event.target.value); setFlipped(false) }}>{subjects.map(item => <option key={item}>{item}</option>)}</select><span>{Math.min(cardIndex + 1, cards.length)} de {cards.length}</span></div><div className="progress"><i style={{ width: `${(Math.min(cardIndex, cards.length) / cards.length) * 100}%` }}/></div><button className={'flashcard ' + (flipped ? 'flipped' : '')} onClick={() => setFlipped(!flipped)}><span className="card-label">{flipped ? 'RESPOSTA' : card.subject.toUpperCase()}</span><strong>{flipped ? card.answer : card.question}</strong><small>{flipped ? 'Escolha como foi lembrar' : 'Toque para revelar a resposta'}</small></button>{flipped && <div className="rating"><button onClick={() => onRate(card, 'again')}><X/>Não lembrei<small>agora</small></button><button onClick={() => onRate(card, 'hard')}>Difícil<small>amanhã</small></button><button className="good" onClick={() => onRate(card, 'good')}><Check/>Lembrei<small>{card.repetitions ? 'mais tarde' : 'amanhã'}</small></button></div>}</>
}
function CardsPage({ cards, onDelete, onCreate }: { cards: Card[]; onDelete: (card: Card) => void; onCreate: () => void }) { return <><div className="section-title cards-head"><div><p className="eyebrow">BIBLIOTECA</p><h1>Seus cartões</h1></div><button className="circle-plus" onClick={onCreate}><Plus/></button></div><div className="card-list">{cards.length ? cards.map(card => <article key={card.id} className="list-card"><span className="subject-dot" style={{ background: subjectColors[card.subject] || '#7895e8' }}/><div><small>{card.subject}</small><strong>{card.question}</strong><p>Próxima revisão: {isDue(card) ? 'agora' : dateLabel(card.nextReview)}</p></div><button className="delete" onClick={() => onDelete(card)} aria-label="Excluir cartão"><X/></button></article>) : <EmptyState text="Ainda não há cartões. Toque no + para criar." />}</div></> }
function SettingsPage({ settings, setSettings, userEmail, onLogin, onRegister, onLogout, onNotifications, supabaseReady }: { settings: { dailyGoal: number; reminderHour: number }; setSettings: (settings: { dailyGoal: number; reminderHour: number }) => void; userEmail: string | null; onLogin: (email: string, password: string) => void; onRegister: (email: string, password: string) => void; onLogout: () => void; onNotifications: () => void; supabaseReady: boolean }) { const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); return <><div className="section-title"><div><p className="eyebrow">PREFERÊNCIAS</p><h1>Seu estudo</h1></div></div><section className="settings-card"><label>Meta de cartões por dia<input type="number" min="1" max="200" value={settings.dailyGoal} onChange={e => setSettings({ ...settings, dailyGoal: Number(e.target.value) })}/></label><label>Horário preferido do lembrete<input type="number" min="0" max="23" value={settings.reminderHour} onChange={e => setSettings({ ...settings, reminderHour: Number(e.target.value) })}/></label><button className="outline" onClick={onNotifications}><Bell size={18}/> Permitir notificações</button></section><section className="settings-card"><div className="sync-title"><Cloud/><div><strong>Sincronização</strong><p>{userEmail ? `Conectado como ${userEmail}` : supabaseReady ? 'Entre para acessar seus cartões em qualquer aparelho.' : 'Configure o Supabase para sincronizar entre dispositivos.'}</p></div></div>{userEmail ? <button className="outline" onClick={onLogout}>Sair da conta</button> : supabaseReady ? <><label>E-mail<input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="voce@email.com"/></label><label>Senha<input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="mínimo de 6 caracteres"/></label><div className="auth-buttons"><button className="primary" onClick={() => onLogin(email, password)}><LogIn size={18}/> Entrar</button><button className="outline" onClick={() => onRegister(email, password)}>Criar conta</button></div></> : <p className="notice">As chaves não ficam no código: adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no Vercel e faça novo deploy.</p>}</section></> }
function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (card: Pick<Card, 'subject' | 'question' | 'answer'>) => void }) { const [subject, setSubject] = useState('Matemática'); const [question, setQuestion] = useState(''); const [answer, setAnswer] = useState(''); return <div className="modal-backdrop"><form className="modal" onSubmit={event => { event.preventDefault(); if (question.trim() && answer.trim()) onCreate({ subject: subject.trim() || 'Geral', question: question.trim(), answer: answer.trim() }) }}><button type="button" className="modal-close" onClick={onClose}><X/></button><p className="eyebrow">NOVO FLASHCARD</p><h2>O que você quer lembrar?</h2><label>Matéria<input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex.: Química" autoFocus/></label><label>Pergunta / frente<textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ex.: Qual é a fórmula da velocidade média?"/></label><label>Resposta / verso<textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Vm = ?S / ?t"/></label><button className="primary" type="submit">Salvar flashcard <ChevronRight size={18}/></button></form></div> }
function NavButton({ icon, label, selected, onClick }: { icon: React.ReactNode; label: string; selected: boolean; onClick: () => void }) { return <button className={selected ? 'selected' : ''} onClick={onClick}>{icon}<span>{label}</span></button> }
function EmptyState({ text }: { text: string }) { return <div className="empty"><Layers size={28}/><p>{text}</p></div> }
interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
