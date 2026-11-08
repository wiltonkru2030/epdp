import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const avatars = [
  { id: 'owl', label: 'Coruja', src: '/arcade/owl-mascot.svg' },
  { id: 'fox', label: 'Raposa', src: '/arcade/fox-friend.svg' },
  { id: 'turtle', label: 'Tartaruga', src: '/arcade/turtle-friend.svg' },
]
type Props = { onSignOut: () => void }

export default function ProfileCenter({ onSignOut }: Props) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('owl')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [createdAt, setCreatedAt] = useState(user?.created_at ?? '')
  const [completed, setCompleted] = useState(0)
  const [tests, setTests] = useState(0)
  const [games, setGames] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      if (!user) return
      const [profile, progress, attempts, gameStats] = await Promise.all([
        supabase.from('profiles').select('full_name,created_at').eq('id', user.id).maybeSingle(),
        supabase.from('user_progress').select('lesson_id').eq('user_id', user.id).eq('completed', true),
        supabase.from('assessment_attempts').select('id').eq('user_id', user.id),
        supabase.from('game_player_stats').select('total_games').eq('user_id', user.id).maybeSingle(),
      ])
      if (!active) return
      setName(profile.data?.full_name || user.user_metadata?.full_name || '')
      setAvatar(user.user_metadata?.avatar || 'owl')
      setEmail(user.email ?? '')
      setCreatedAt(profile.data?.created_at || user.created_at)
      setCompleted(progress.data?.length ?? 0)
      setTests(attempts.data?.length ?? 0)
      setGames(gameStats.data?.total_games ?? 0)
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [user])

  async function saveProfile() {
    if (!user) return
    setSaving(true); setError(''); setMessage('')
    const cleanName = name.trim()
    if (cleanName.length < 3) { setError('Informe um nome com pelo menos três caracteres.'); setSaving(false); return }
    const { error: profileError } = await supabase.from('profiles').update({ full_name: cleanName, updated_at: new Date().toISOString() }).eq('id', user.id)
    if (profileError) { setError('Não foi possível atualizar seu perfil. Tente novamente.'); setSaving(false); return }
    const { error: authError } = await supabase.auth.updateUser({ data: { full_name: cleanName, avatar } })
    setSaving(false)
    if (authError) { setError('O nome foi salvo, mas não foi possível atualizar a personalização.'); return }
    setMessage('Perfil atualizado com sucesso.')
  }

  async function changeEmail() {
    if (!user || !email.trim() || email.trim() === user.email) { setMessage('Informe um novo e-mail para solicitar a alteração.'); return }
    setSaving(true); setError(''); setMessage('')
    const { error: updateError } = await supabase.auth.updateUser({ email: email.trim() })
    setSaving(false)
    if (updateError) setError('Não foi possível solicitar a troca de e-mail. Confira o endereço e tente novamente.')
    else setMessage('Solicitação enviada. Confira sua caixa de entrada para confirmar o novo e-mail.')
  }

  async function changePassword() {
    if (password.length < 8) { setError('A nova senha deve ter pelo menos oito caracteres.'); return }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return }
    setSaving(true); setError(''); setMessage('')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (updateError) setError('Não foi possível alterar a senha. Entre novamente e tente mais tarde.')
    else { setPassword(''); setConfirmPassword(''); setMessage('Senha alterada com sucesso.') }
  }

  if (loading) return <section className="dashboard-loading">Carregando seu perfil...</section>
  const selectedAvatar = avatars.find(item => item.id === avatar) ?? avatars[0]
  return <div className="profile-page">
    <section className="profile-hero"><img src={selectedAvatar.src} alt={selectedAvatar.label}/><div><small>ÁREA DO ESTUDANTE</small><h2>{name || 'Seu perfil'}</h2><p>{user?.email}</p><span>Membro desde {new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium'}).format(new Date(createdAt))}</span></div></section>
    {message && <div className="profile-message">{message}</div>}{error && <div className="profile-error">{error}</div>}
    <section className="profile-card"><div className="profile-section-heading"><div><small>IDENTIDADE</small><h3>Personalize seu perfil</h3></div></div><label className="profile-field">Nome completo<input value={name} onChange={e => setName(e.target.value)} maxLength={80} autoComplete="name"/></label><div className="profile-field"><span>Escolha seu mascote</span><div className="profile-avatars">{avatars.map(item => <button type="button" className={avatar === item.id ? 'selected' : ''} key={item.id} onClick={() => setAvatar(item.id)} aria-pressed={avatar === item.id}><img src={item.src} alt=""/><span>{item.label}</span></button>)}</div></div><button className="profile-save" onClick={() => void saveProfile()} disabled={saving}>{saving ? 'Salvando...' : 'Salvar perfil'}</button></section>
    <section className="profile-card"><div className="profile-section-heading"><div><small>SEGURANÇA DA CONTA</small><h3>Dados de acesso</h3></div></div><label className="profile-field">E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"/></label><button className="profile-secondary" onClick={() => void changeEmail()} disabled={saving}>Solicitar alteração de e-mail</button><div className="profile-password-grid"><label className="profile-field">Nova senha<input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} autoComplete="new-password" placeholder="Mínimo de 8 caracteres"/></label><label className="profile-field">Confirmar nova senha<input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password"/></label></div><button className="profile-secondary" onClick={() => void changePassword()} disabled={saving}>Alterar senha</button></section>
    <section className="profile-card"><div className="profile-section-heading"><div><small>SEU DESEMPENHO</small><h3>Resumo da jornada</h3></div></div><div className="profile-report"><article><b>{completed}</b><span>Aulas concluídas</span></article><article><b>{tests}</b><span>Avaliações realizadas</span></article><article><b>{games}</b><span>Partidas de jogos</span></article></div></section>
    <section className="profile-card profile-exit"><div><h3>Sair da conta</h3><p>Encerre sua sessão neste dispositivo.</p></div><button onClick={onSignOut}>Sair com segurança</button></section>
  </div>
}
