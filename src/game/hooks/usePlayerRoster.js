import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { MERCENARY_TEMPLATES } from '../data/mercenaryTemplates'

const STARTER_MERCS = [
  { template_id: 1, level: 1, xp: 0 },
  { template_id: 1, level: 1, xp: 0 },
  { template_id: 2, level: 1, xp: 0 },
  { template_id: 2, level: 1, xp: 0 },
  { template_id: 3, level: 1, xp: 0 },
]

export function usePlayerRoster() {
  const { session } = useAuth()
  const [roster, setRoster] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      setRoster([])
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('player_mercenaries')
          .select('*')
          .eq('user_id', session.user.id)

        if (error) throw error

        if (!data || data.length === 0) {
          const inserts = STARTER_MERCS.map(m => ({
            user_id: session.user.id,
            ...m,
          }))
          const { data: created, error: insError } = await supabase
            .from('player_mercenaries')
            .insert(inserts)
            .select()
          if (insError) throw insError

          if (!cancelled) {
            const merged = created.map(pm => ({
              ...pm,
              template: MERCENARY_TEMPLATES.find(t => t.id === pm.template_id),
            }))
            setRoster(merged)
          }
        } else {
          if (!cancelled) {
            const merged = data.map(pm => ({
              ...pm,
              template: MERCENARY_TEMPLATES.find(t => t.id === pm.template_id),
            }))
            setRoster(merged)
          }
        }
      } catch (err) {
        console.error('Failed to load roster:', err)
        if (!cancelled) {
          setRookieRoster(setRoster)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [session])

  return { roster, loading, setRoster }
}

function setRookieRoster(setRoster) {
  const fallback = STARTER_MERCS.map((m, i) => ({
    id: i + 1,
    template_id: m.template_id,
    level: m.level,
    xp: m.xp,
    template: MERCENARY_TEMPLATES.find(t => t.id === m.template_id),
  }))
  setRoster(fallback)
}
