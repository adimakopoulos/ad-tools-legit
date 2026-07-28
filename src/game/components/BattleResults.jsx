import React from 'react'
import { calcXpReward, calcGoldReward } from '../engine/StatsCalculator'

export default function BattleResults({ result, arena, onRetry, onNextArena, hasNextArena }) {
  if (!result) return null

  const xpGained = calcXpReward(
    arena.difficulty,
    result.totalMercs - result.mercsLost,
    result.totalMercs,
    result.won
  )
  const goldGained = calcGoldReward(arena.difficulty, result.won)

  return (
    <div className="glass rounded-3xl p-6 text-center">
      <div className={`text-4xl mb-3 ${result.won ? 'text-emerald-400' : 'text-red-400'}`}>
        {result.won ? 'VICTORY' : 'DEFEAT'}
      </div>
      <p className="text-sm text-slate-400 mb-4">
        {result.won
          ? `You crushed ${arena.name}! ${result.totalMercs - result.mercsLost}/${result.totalMercs} mercenaries survived.`
          : `Your mercenaries were overwhelmed in ${arena.name}.`}
      </p>

      <div className="flex items-center justify-center gap-6 mb-5 text-xs">
        <div>
          <div className="text-slate-400">XP Earned</div>
          <div className="text-lg font-semibold text-amber-400">+{xpGained}</div>
        </div>
        <div>
          <div className="text-slate-400">Gold Earned</div>
          <div className="text-lg font-semibold text-amber-400">+{goldGained}</div>
        </div>
        <div>
          <div className="text-slate-400">Time</div>
          <div className="text-lg font-semibold text-slate-200">{result.elapsed.toFixed(1)}s</div>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button onClick={onRetry} className="btn-primary text-sm px-5 py-2 rounded-xl">
          Retry
        </button>
        {hasNextArena && (
          <button onClick={onNextArena} className="btn-primary text-sm px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500">
            Next Arena
          </button>
        )}
      </div>
    </div>
  )
}
