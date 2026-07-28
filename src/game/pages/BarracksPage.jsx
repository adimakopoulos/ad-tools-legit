import React from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerRoster } from '../hooks/usePlayerRoster'
import { usePlayerProgress } from '../hooks/usePlayerProgress'
import Barracks from '../components/Barracks'

export default function BarracksPage() {
  const navigate = useNavigate()
  const { roster, loading: rosterLoading } = usePlayerRoster()
  const { progress, loading: progLoading } = usePlayerProgress()

  if (rosterLoading || progLoading) {
    return (
      <div className="mt-6">
        <p className="text-sm text-slate-400">Loading barracks...</p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/game')}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          &larr; Game Menu
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-200">Barracks</h1>
      </div>
      <Barracks roster={roster} progress={progress} />
    </div>
  )
}
