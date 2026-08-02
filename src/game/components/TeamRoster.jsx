import React from 'react'
import { MERCENARY_TEMPLATES } from '../data/mercenaryTemplates'
import { calcStats, levelInfo } from '../engine/StatsCalculator'

export default function TeamRoster({ roster, selectedMercId, onSelect, placedCount, maxPlace, deployedIds }) {
  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200">Your Mercenaries</h3>
        <span className="text-xs text-slate-400">{placedCount}/{maxPlace} deployed</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {roster.map(pm => {
          const template = MERCENARY_TEMPLATES.find(t => t.id === pm.template_id)
          if (!template) return null
          const info = levelInfo(pm.xp)
          const level = info.level
          const stats = calcStats(template, level)
          const isSelected = selectedMercId === pm.id
          const isDeployed = deployedIds?.includes(pm.id)

          return (
            <div
              key={pm.id}
              onClick={() => !isDeployed && onSelect(pm.id)}
              className={`rounded-2xl p-3 transition-all shrink-0 w-[160px] ${
                isDeployed
                  ? 'bg-slate-800/20 opacity-40 cursor-not-allowed'
                  : isSelected
                  ? 'bg-sky-500/20 ring-2 ring-sky-400 cursor-pointer'
                  : 'bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-slate-900 shrink-0"
                  style={{ backgroundColor: template.color }}
                >
                  {template.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">{template.name}</div>
                  <div className="text-xs text-sky-300">Lv.{level}</div>
                </div>
              </div>
              <div className="flex gap-2 text-xs text-slate-400">
                <span>HP {stats.hp}</span>
                <span>ATK {stats.atk}</span>
              </div>
              <div className="flex gap-2 text-xs text-slate-400">
                <span>DEF {stats.def}</span>
                <span>SPD {stats.speed}</span>
              </div>
              {!info.isMaxLevel && (
                <div className="mt-2 w-full bg-slate-700 rounded-full h-1">
                  <div
                    className="bg-sky-400 h-1 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (info.xpIntoLevel / info.xpForNext) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
