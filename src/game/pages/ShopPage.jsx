import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { usePlayerRoster } from '../hooks/usePlayerRoster'
import { usePlayerProgress } from '../hooks/usePlayerProgress'
import Shop from '../components/Shop'

export default function ShopPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { roster, setRoster } = usePlayerRoster()
  const { progress, spendGold } = usePlayerProgress()

  const handleBuy = useCallback(async (template) => {
    if (!session?.user || !progress) return

    const cost = template.tier === 1 ? 100 : 250
    const ok = await spendGold(cost)
    if (!ok) return

    try {
      const { data, error } = await supabase
        .from('player_mercenaries')
        .insert({
          user_id: session.user.id,
          template_id: template.id,
          level: 1,
          xp: 0,
        })
        .select()
        .single()

      if (error) throw error

      setRoster(prev => [...prev, { ...data, template }])
    } catch (err) {
      console.error('Failed to buy merc:', err)
    }
  }, [session, progress, spendGold, setRoster])

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/game')}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          &larr; Game Menu
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-200">Shop</h1>
      </div>
      <Shop
        roster={roster}
        gold={progress?.gold ?? 0}
        onBuy={handleBuy}
      />
    </div>
  )
}
