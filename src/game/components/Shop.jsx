import React, { useState } from 'react'
import { MERCENARY_TEMPLATES } from '../data/mercenaryTemplates'
import { calcStats } from '../engine/StatsCalculator'

const MERC_COST = { 1: 100, 2: 100, 3: 100, 4: 250, 5: 250 }

export default function Shop({ roster, gold, onBuy }) {
  const [buying, setBuying] = useState(null)

  const ownedCount = (templateId) =>
    roster.filter(r => r.template_id === templateId).length

  const handleBuy = async (template) => {
    setBuying(template.id)
    await onBuy(template)
    setBuying(null)
  }

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-200">Mercenary Shop</h2>
        <div className="text-sm text-amber-400 font-medium">
          {gold} <span className="text-xs text-slate-400">gold</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MERCENARY_TEMPLATES.map(template => {
          const owned = ownedCount(template.id)
          const cost = MERC_COST[template.id]
          const stats = calcStats(template, 1)
          const canAfford = gold >= cost

          return (
            <div
              key={template.id}
              className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-slate-900"
                  style={{ backgroundColor: template.color }}
                >
                  {template.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">{template.name}</div>
                  <div className="text-xs text-sky-300">Tier {template.tier}</div>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-3">{template.description}</p>

              <div className="grid grid-cols-4 gap-1 text-xs text-center mb-3">
                <div className="bg-slate-700/50 rounded-lg p-1">
                  <div className="text-slate-400">HP</div>
                  <div className="text-emerald-300 font-medium">{stats.hp}</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-1">
                  <div className="text-slate-400">ATK</div>
                  <div className="text-red-300 font-medium">{stats.atk}</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-1">
                  <div className="text-slate-400">DEF</div>
                  <div className="text-blue-300 font-medium">{stats.def}</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-1">
                  <div className="text-slate-400">SPD</div>
                  <div className="text-amber-300 font-medium">{stats.speed}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Owned: {owned}</span>
                <button
                  onClick={() => handleBuy(template)}
                  disabled={!canAfford || buying === template.id}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    !canAfford
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                >
                  {buying === template.id ? '...' : `Buy ${cost}g`}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
