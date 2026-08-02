import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { MERCENARY_TEMPLATES } from '../data/mercenaryTemplates'
import { levelInfo } from '../engine/StatsCalculator'

const STARTER_MERCS = []

function buildFallbackRoster() {
  return []
}

export function usePlayerRoster() {
  const { session } = useAuth()
  const [roster, setRoster] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      setRoster(buildFallbackRoster())
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
          if (!cancelled) setRoster([])
          return
        }

        const merged = data.map(pm => {
          const level = levelInfo(pm.xp).level
          if (level !== pm.level) {
            supabase.from('player_mercenaries').update({ level }).eq('id', pm.id).then(() => {})
          }
          return {
            ...pm,
            level,
            template: MERCENARY_TEMPLATES.find(t => t.id === pm.template_id),
          }
        })
        if (!cancelled) setRoster(merged)
      } catch (err) {
        console.error('Failed to load roster:', err)
        if (!cancelled) setRoster(buildFallbackRoster())
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [session])

  return { roster, loading, setRoster }
}
