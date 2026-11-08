import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type Props = { onClose: () => void; required?: boolean; initialMode?: 'login' | 'signup' }
type Mode = 'login' | 'signup' | 'reset'

export default function AuthModal({ onClose, required = false }: Props) {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')
    if (!supabase) {
      setError('A conexão com o Supabase ainda não foi configurada. Vamos concluir essa configuração antes de ativar as contas.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() } },
        })
        if (authError) throw authError
        setMessage(data.session ? 'Conta criada! Você já está conectado.' : 'Cadastro recebido. Confira seu e-mail para confirmar a conta.')
      } else if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) throw authError
        onClose()
      } else {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email)
        if (authError) throw authError
        setMessage('Se o e-mail estiver cadastrado, você receberá as instruções para redefinir a senha.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const title = mode === 'signup' ? 'Crie sua conta' : mode === 'reset' ? 'Recuperar senha' : 'Acesse sua conta'
  return <div className={required ? 'overlay auth-required-overlay' : 'overlay'} onClick={required ? undefined : onClose}>
    <section className="modal auth-modal" onClick={event => event.stopPropagation()}>
      {!required && <button className="close" onClick={onClose} aria-label="Fechar">×</button>}
      <small>ESTUDO PROFUNDO DE PORTUGUÊS</small>
      <h2>{title}</h2>
      <p>{mode === 'signup' ? 'Comece sua jornada de aprendizagem.' : mode === 'reset' ? 'Informe seu e-mail para receber o link de recuperação.' : 'Entre para acompanhar seu aprendizado.'}</p>
      <form onSubmit={submit}>
        {mode === 'signup' && <label>Nome completo<input value={name} onChange={event => setName(event.target.value)} autoComplete="name" required minLength={2} placeholder="Seu nome" /></label>}
        <label>E-mail<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required placeholder="seuemail@exemplo.com" /></label>
        {mode !== 'reset' && <label>Senha<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} placeholder="Mínimo de 8 caracteres" /></label>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-success" role="status">{message}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : mode === 'reset' ? 'Enviar instruções' : 'Entrar'}</button>
      </form>
      <div className="auth-links">
        {mode === 'login' && <><button onClick={() => { setMode('reset'); setError(''); setMessage('') }}>Esqueci minha senha</button><button onClick={() => { setMode('signup'); setError(''); setMessage('') }}>Criar uma conta</button></>}
        {mode !== 'login' && <button onClick={() => { setMode('login'); setError(''); setMessage('') }}>Voltar para entrar</button>}
      </div>
      <small>Use uma senha exclusiva. Nunca compartilhe sua senha com ninguém.</small>
    </section>
  </div>
}
