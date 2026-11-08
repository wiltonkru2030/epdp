import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type Props = { onNavigate: (page: 'Meu curso' | 'Testes e avaliações' | 'Jogos educativos' | 'Reforço') => void }
type Lesson = { id: string; title: string; description: string; position: number }
type Activity = { title: string; detail: string; created_at: string; kind: 'lesson' | 'assessment' | 'game' }

export default function DashboardCenter({ onNavigate }: Props) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('Estudante')
  const [totalLessons, setTotalLessons] = useState(0)
  const [completedLessons, setCompletedLessons] = useState(0)
  const [continueLesson, setContinueLesson] = useState<Lesson | null>(null)
  const [xp, setXp] = useState<number | null>(null)
  const [games, setGames] = useState<number | null>(null)
  const [average, setAverage] = useState<number | null>(null)
  const [recommendationCount, setRecommendationCount] = useState<number | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      if (!user) return
      setLoading(true)
      const [profile, lessons, progress, gameStats, attempts, recs, recentProgress, recentGames, recentTests] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
        supabase.from('lessons').select('id,title,description,position').eq('published', true).order('position'),
        supabase.from('user_progress').select('lesson_id,completed,updated_at').eq('user_id', user.id).eq('completed', true),
        supabase.from('game_player_stats').select('xp,total_games').eq('user_id', user.id).maybeSingle(),
        supabase.from('assessment_attempts').select('score').eq('user_id', user.id).limit(50),
        supabase.from('study_recommendations').select('id').eq('user_id', user.id).eq('status', 'pending'),
        supabase.from('user_progress').select('lesson_id,updated_at').eq('user_id', user.id).eq('completed', true).order('updated_at', { ascending: false }).limit(4),
        supabase.from('game_attempts').select('game_slug,score,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
        supabase.from('assessment_attempts').select('assessment_type,score,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
      ])
      if (!active) return
      if (lessons.error || progress.error) setError('Não foi possível carregar todo o seu resumo. Atualize a página para tentar novamente.')
      const lessonList = (lessons.data ?? []) as Lesson[]
      const completed = progress.data ?? []
      const completedIds = new Set(completed.map(row => row.lesson_id))
      const next = lessonList.find(item => !completedIds.has(item.id)) ?? lessonList[lessonList.length - 1] ?? null
      setName(profile.data?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Estudante')
      setTotalLessons(lessonList.length)
      setCompletedLessons(completed.length)
      setContinueLesson(next)
      setXp(gameStats.data?.xp ?? null)
      setGames(gameStats.data?.total_games ?? null)
      const scores = (attempts.data ?? []).map(row => Number(row.score)).filter(Number.isFinite)
      setAverage(scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null)
      setRecommendationCount(recs.data?.length ?? null)
      const lessonMap = new Map(lessonList.map(item => [item.id, item.title]))
      const merged: Activity[] = [
        ...(recentProgress.data ?? []).map(row => ({ title: lessonMap.get(row.lesson_id) ?? 'Aula concluída', detail: 'Aula marcada como concluída', created_at: row.updated_at, kind: 'lesson' as const })),
        ...(recentGames.data ?? []).map(row => ({ title: row.game_slug.replaceAll('-', ' '), detail: `Jogo concluído · ${row.score} pontos`, created_at: row.created_at, kind: 'game' as const })),
        ...(recentTests.data ?? []).map(row => ({ title: row.assessment_type === 'mock_exam' ? 'Simulado' : 'Avaliação', detail: `Nota registrada: ${Number(row.score).toFixed(1)}`, created_at: row.created_at, kind: 'assessment' as const })),
      ].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0,5)
      setActivities(merged)
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [user])

  const progress = totalLessons ? Math.round(completedLessons / totalLessons * 100) : 0
  const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value))

  if (loading) return <section className="dashboard-loading">Preparando seu painel de aprendizagem...</section>
  return <div className="dashboard-page">
    <section className="dashboard-welcome">
      <div><small>SEU ESPAÇO DE APRENDIZAGEM</small><h2>Olá, {name.split(' ')[0]}.</h2><p>Seu próximo avanço começa com um passo de cada vez. Vamos continuar?</p><button onClick={() => onNavigate('Meu curso')}>Continuar estudando</button></div>
      <div className="dashboard-welcome-art" aria-hidden="true"><span>EP</span><b>Aa</b><i>LEITURA · GRAMÁTICA · PRÁTICA</i></div>
    </section>
    {error && <p className="dashboard-error">{error}</p>}
    <section className="dashboard-metrics">
      <article><small>PROGRESSO DO CURSO</small><strong>{progress}%</strong><div className="dashboard-progress"><span style={{width: progress + '%'}} /></div><p>{completedLessons} de {totalLessons} aulas concluídas</p></article>
      <article><small>EXPERIÊNCIA EM JOGOS</small><strong>{xp === null ? '—' : xp.toLocaleString('pt-BR')}</strong><p>{games === null ? 'Nenhuma partida registrada ainda' : `${games} partidas realizadas`}</p></article>
      <article><small>MÉDIA DAS AVALIAÇÕES</small><strong>{average === null ? '—' : average.toFixed(1).replace('.', ',')}</strong><p>{average === null ? 'Faça uma avaliação para iniciar seu histórico' : 'Média das tentativas registradas'}</p></article>
    </section>
    <section className="dashboard-columns">
      <article className="dashboard-panel dashboard-continue"><div className="dashboard-panel-heading"><div><small>PRÓXIMO PASSO</small><h3>{continueLesson ? 'Continue sua trilha' : 'Trilha concluída'}</h3></div><span className="dashboard-panel-icon">01</span></div>
        {continueLesson ? <><b>{continueLesson.title}</b><p>{continueLesson.description}</p><button onClick={() => onNavigate('Meu curso')}>Abrir aula <span>→</span></button></> : <p>{totalLessons ? 'Você concluiu todas as aulas publicadas. Novos conteúdos serão exibidos aqui quando estiverem disponíveis.' : 'Ainda não há aulas publicadas.'}</p>}
      </article>
      <article className="dashboard-panel"><div className="dashboard-panel-heading"><div><small>APOIO PERSONALIZADO</small><h3>Seu reforço</h3></div><span className="dashboard-panel-icon">02</span></div><p>{recommendationCount === null ? 'Carregando recomendações...' : recommendationCount ? `Você tem ${recommendationCount} recomendação(ões) para revisar.` : 'Nenhuma recomendação pendente. Continue praticando para manter seu ritmo.'}</p><button className="dashboard-text-button" onClick={() => onNavigate('Reforço')}>Ver recomendações →</button></article>
    </section>
    <section className="dashboard-quick-links"><button onClick={() => onNavigate('Testes e avaliações')}><b>Testes e avaliações</b><span>Confira seu domínio dos assuntos</span></button><button onClick={() => onNavigate('Jogos educativos')}><b>Jogos educativos</b><span>Pratique com desafios interativos</span></button><button onClick={() => onNavigate('Meu curso')}><b>Meu curso</b><span>Explore as aulas publicadas</span></button></section>
    <section className="dashboard-panel dashboard-activity"><div className="dashboard-panel-heading"><div><small>SEU HISTÓRICO</small><h3>Atividades recentes</h3></div></div>
      {activities.length ? <div className="dashboard-activity-list">{activities.map((item,index) => <article key={item.kind + item.created_at + index}><span className={'activity-dot ' + item.kind}></span><div><b>{item.title}</b><small>{item.detail}</small></div><time>{date(item.created_at)}</time></article>)}</div> : <p>Suas atividades aparecerão aqui quando você concluir aulas, jogos ou avaliações.</p>}
    </section>
  </div>
}
