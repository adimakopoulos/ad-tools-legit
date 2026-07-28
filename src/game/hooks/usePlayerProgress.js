import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { xpForLevel } from '../engine/StatsCalculator'

const STARTING_GOLD = 200
const DEFAULT_PROGRESS = { level: 1, total_xp: 0, gold: STARTING_GOLD, highest_arena: 0 }

export function usePlayerProgress() {
  const { session } = useAuth()
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      setProgress({ ...DEFAULT_PROGRESS })
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('player_progress')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle()

        if (error) throw error

        if (!data) {
          try {
            const { data: created, error: insError } = await supabase
              .from('player_progress')
              .insert({ user_id: session.user.id, level: 1, total_xp: 0, gold: STARTING_GOLD, highest_arena: 0 })
              .select()
              .single()
            if (!insError && created) {
              if (created.gold === undefined || created.gold === 0) created.gold = STARTING_GOLD
              if (!cancelled) setProgress(created)
              return
            }
          } catch (_) {}
          if (!cancelled) setProgress({ ...DEFAULT_PROGRESS })
          return
        }

        if (data.gold === undefined || data.gold === 0) {
          data.gold = STARTING_GOLD
          try { await supabase.from('player_progress').update({ gold: STARTING_GOLD }).eq('user_id', session.user.id) } catch (_) {}
        }
        if (!cancelled) setProgress(data)
      } catch (err) {
        console.error('Failed to load progress:', err)
        if (!cancelled) setProgress({ ...DEFAULT_PROGRESS })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [session])

  const addXp = useCallback(async (xpAmount) => {
    if (!session?.user) return

    const cur = progress || DEFAULT_PROGRESS
    const newTotal = cur.total_xp + xpAmount
    let newLevel = cur.level
    while (newTotal >= xpForLevel(newLevel)) {
      newLevel++
    }

    const patch = { total_xp: newTotal, level: newLevel }
    setProgress(prev => ({ ...(prev || DEFAULT_PROGRESS), ...patch }))

    try {
      await supabase.from('player_progress').update(patch).eq('user_id', session.user.id)
    } catch (_) {}
  }, [session, progress])

  const addGold = useCallback(async (amount) => {
    const cur = progress || DEFAULT_PROGRESS
    const newGold = (cur.gold || 0) + amount
    setProgress(prev => ({ ...(prev || DEFAULT_PROGRESS), gold: newGold }))

    if (!session?.user) return
    try {
      await supabase.from('player_progress').update({ gold: newGold }).eq('user_id', session.user.id)
    } catch (_) {}
  }, [session, progress])

  const spendGold = useCallback(async (amount) => {
    const cur = progress || DEFAULT_PROGRESS
    if ((cur.gold || 0) < amount) return false

    const newGold = cur.gold - amount
    setProgress(prev => ({ ...(prev || DEFAULT_PROGRESS), gold: newGold }))

    if (session?.user) {
      try {
        await supabase.from('player_progress').update({ gold: newGold }).eq('user_id', session.user.id)
      } catch (_) {}
    }
    return true
  }, [session, progress])

  const unlockArena = useCallback(async (arenaId) => {
    const cur = progress || DEFAULT_PROGRESS
    if (arenaId <= cur.highest_arena) return

    setProgress(prev => ({ ...(prev || DEFAULT_PROGRESS), highest_arena: arenaId }))

    if (!session?.user) return
    try {
      await supabase.from('player_progress').update({ highest_arena: arenaId }).eq('user_id', session.user.id)
    } catch (_) {}
  }, [session, progress])

  return { progress, loading, addXp, addGold, spendGold, unlockArena }
}
