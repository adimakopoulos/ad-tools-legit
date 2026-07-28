import React from 'react'
import { Link } from 'react-router-dom'
import { usePlayerProgress } from '../hooks/usePlayerProgress'
import { usePlayerRoster } from '../hooks/usePlayerRoster'

const sections = [
  {
    id: 'arenas',
    name: 'Arenas',
    description: 'Fight in PvE battles. Place your mercenaries and watch them fight in real-time.',
    to: '/game/arenas',
    icon: '⚔️',
  },
  {
    id: 'barracks',
    name: 'Barracks',
    description: 'View all your hired mercenaries, their stats, and level progress.',
    to: '/game/barracks',
    icon: '🏠',
  },
  {
    id: 'shop',
    name: 'Shop',
    description: 'Buy new mercenaries to expand your roster with gold earned from battles.',
    to: '/game/shop',
    icon: '🛒',
  },
]

export default function GameHub() {
  const { progress, loading: progLoading } = usePlayerProgress()
  const { roster, loading: rosterLoading } = usePlayerRoster()

  if (progLoading || rosterLoading) {
    return (
      <div className="mt-6">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-200">Arena Battles</h1>
          <p className="text-sm text-slate-400 mt-1">Hire mercenaries, fight zombies, conquer arenas.</p>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-400">Player Lv.{progress?.level ?? 1}</div>
          <div className="text-amber-400 font-medium">
            {progress?.gold ?? 0} <span className="text-xs">gold</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {sections.map(s => (
          <Link
            key={s.id}
            to={s.to}
            className="glass tile-hover rounded-3xl p-6 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-2xl">{s.icon}</div>
                <div className="text-xs uppercase tracking-wide text-sky-400/80">
                  {s.id === 'arenas' ? `${roster.length} mercs` : s.id === 'shop' ? `${progress?.gold ?? 0} gold` : ''}
                </div>
              </div>
              <h2 className="text-lg font-semibold mb-1 group-hover:text-sky-300">{s.name}</h2>
              <p className="text-xs text-slate-400">{s.description}</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-sky-300">
              <span>Enter</span>
              <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
