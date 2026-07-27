import React from 'react'
import { ARENAS } from '../data/arenas'

export default function ArenaSelect({ progress, onSelect }) {
  const highestArena = progress?.highest_arena ?? 0

  return (
    <div className="glass rounded-3xl p-6">
      <h2 className="text-xl font-semibold text-slate-200 mb-4">Choose Arena</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ARENAS.map(arena => {
          const locked = arena.id > highestArena + 1
          const cleared = arena.id <= highestArena

          return (
            <button
              key={arena.id}
              onClick={() => !locked && onSelect(arena)}
              disabled={locked}
              className={`rounded-2xl p-4 text-left transition-all border ${
                locked
                  ? 'border-slate-700/50 bg-slate-800/30 opacity-50 cursor-not-allowed'
                  : cleared
                  ? 'border-emerald-500/30 bg-emerald-900/10 hover:bg-emerald-900/20'
                  : 'border-sky-500/30 bg-sky-900/10 hover:bg-sky-900/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{locked ? '🔒' : cleared ? '✅' : '⚔️'}</span>
                  <span className="font-semibold text-sm text-slate-200">{arena.name}</span>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3].map(s => (
                    <span
                      key={s}
                      className={`text-xs ${s <= arena.difficulty ? 'text-amber-400' : 'text-slate-600'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400">{arena.description}</p>
              <div className="mt-2 text-xs text-slate-500">
                {locked ? `Reach player level ${arena.minPlayerLevel}` : `Min level: ${arena.minPlayerLevel}`}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
