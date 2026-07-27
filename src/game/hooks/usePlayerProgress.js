import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { xpForLevel } from '../engine/StatsCalculator'

export function usePlayerProgress() {
  const { session } = useAuth()
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        let { data, error } = await supabase
          .from('player_progress')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle()

        if (error) throw error

        if (!data) {
          const { data: created, error: insError } = await supabase
            .from('player_progress')
            .insert({ user_id: session.user.id, level: 1, total_xp: 0, highest_arena: 0 })
            .select()
            .single()
          if (insError) throw insError
          data = created
        }

        if (!cancelled) {
          setProgress(data)
        }
      } catch (err) {
        console.error('Failed to load progress:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [session])

  const addXp = useCallback(async (xpAmount) => {
    if (!session?.user || !progress) return

    const newTotal = progress.total_xp + xpAmount
    let newLevel = progress.level
    while (newTotal >= xpForLevel(newLevel)) {
      newLevel++
    }

    const updated = { total_xp: newTotal, level: newLevel }

    try {
      const { error } = await supabase
        .from('player_progress')
        .update(updated)
        .eq('user_id', session.user.id)
      if (error) throw error
      setProgress(prev => ({ ...prev, ...updated }))
    } catch (err) {
      console.error('Failed to add XP:', err)
    }
  }, [session, progress])

  const unlockArena = useCallback(async (arenaId) => {
    if (!session?.user || !progress) return
    if (arenaId <= progress.highest_arena) return

    try {
      const { error } = await supabase
        .from('player_progress')
        .update({ highest_arena: arenaId })
        .eq('user_id', session.user.id)
      if (error) throw error
      setProgress(prev => ({ ...prev, highest_arena: arenaId }))
    } catch (err) {
      console.error('Failed to update progress:', err)
    }
  }, [session, progress])

  return { progress, loading, addXp, unlockArena }
}
