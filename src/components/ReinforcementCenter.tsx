import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Recommendation = { id: string; subject: string; reason: string; recommendation_type: string; status: string; created_at: string; lesson_id: string | null }

export default function ReinforcementCenter() {
  const [items, setItems] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    async function load() {
      const { data, error } = await supabase.from('study_recommendations')
        .select('id,subject,reason,recommendation_type,status,created_at,lesson_id')
        .eq('status', 'pending').order('created_at', { ascending: false })
      if (!active) return
      if (error) setError('Não foi possível carregar suas recomendações de estudo.')
      else setItems((data ?? []) as Recommendation[])
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [])
  async function complete(id: string) {
    const { error } = await supabase.from('study_recommendations').update({ status: 'completed' }).eq('id', id)
    if (error) setError('Não foi possível atualizar esta recomendação.')
    else setItems(current => current.filter(item => item.id !== id))
  }
  return <section className="reinforcement-center">
    <div className="intro"><small>REVISÃO DIRECIONADA</small><h2>Reforço</h2><p>Esta área apresenta recomendações registradas a partir do acompanhamento do seu aprendizado.</p></div>
    {loading ? <div className="card panel">Carregando recomendações...</div> : error ? <p className="auth-error">{error}</p> :
      items.length === 0 ? <div className="card panel empty"><b>Você não tem recomendações pendentes</b><span>Conclua avaliações para que seu desempenho possa orientar futuras revisões. Não exibimos atividades aleatórias.</span></div> :
      items.map(item => <article className="card recommendation-card" key={item.id}>
        <small>{item.recommendation_type === 'lesson' ? 'AULA RECOMENDADA' : item.recommendation_type === 'review' ? 'REVISÃO' : 'PRÁTICA EXTRA'}</small>
        <h3>{item.subject}</h3><p>{item.reason}</p>
        <button className="soft" onClick={() => void complete(item.id)}>Marcar como revisada</button>
      </article>)}
  </section>
}
