import React from 'react'
import { MERCENARY_TEMPLATES } from '../data/mercenaryTemplates'
import { calcStats, xpForLevel } from '../engine/StatsCalculator'

export default function TeamRoster({ roster, selectedMercId, onSelect, placedCount, maxPlace }) {
  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200">Your Mercenaries</h3>
        <span className="text-xs text-slate-400">{placedCount}/{maxPlace} deployed</span>
      </div>
      <div className="space-y-2 max-h-[420px] overflow-y-auto">
        {roster.map(pm => {
          const template = MERCENARY_TEMPLATES.find(t => t.id === pm.template_id)
          if (!template) return null
          const stats = calcStats(template, pm.level)
          const isSelected = selectedMercId === pm.id
          const nextLevelXp = xpForLevel(pm.level)

          return (
            <div
              key={pm.id}
              onClick={() => onSelect(pm.id)}
              className={`rounded-2xl p-3 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-sky-500/20 ring-2 ring-sky-400'
                  : 'bg-slate-800/50 hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-slate-900 shrink-0"
                  style={{ backgroundColor: template.color }}
                >
                  {template.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200">{template.name}</span>
                    <span className="text-xs text-sky-300">Lv.{pm.level}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-400 mt-1">
                    <span>HP {stats.hp}</span>
                    <span>ATK {stats.atk}</span>
                    <span>DEF {stats.def}</span>
                    <span>SPD {stats.speed}</span>
                  </div>
                  {pm.level < 10 && (
                    <div className="mt-1.5 w-full bg-slate-700 rounded-full h-1">
                      <div
                        className="bg-sky-400 h-1 rounded-full transition-all"
                        style={{ width: `${(pm.xp / nextLevelXp) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
