import React from 'react'
import { usePlayerRoster } from '../hooks/usePlayerRoster'
import { usePlayerProgress } from '../hooks/usePlayerProgress'
import Barracks from '../components/Barracks'

export default function BarracksPage() {
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
      <Barracks roster={roster} progress={progress} />
    </div>
  )
}
