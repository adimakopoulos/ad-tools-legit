import React from 'react'
import { MERCENARY_TEMPLATES } from '../data/mercenaryTemplates'
import { calcStats, levelInfo } from '../engine/StatsCalculator'

export default function Barracks({ roster, progress }) {
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-200">Barracks</h2>
        <div className="text-xs text-slate-400">
          Player Level: <span className="text-amber-400 font-semibold">{progress?.level ?? 1}</span>
        </div>
      </div>

      {roster.length === 0 ? (
        <p className="text-sm text-slate-400">No mercenaries yet. Battle in the arena to recruit!</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roster.map(pm => {
            const template = MERCENARY_TEMPLATES.find(t => t.id === pm.template_id)
            if (!template) return null
            const info = levelInfo(pm.xp)
            const level = info.level
            const stats = calcStats(template, level)
            const isMaxLevel = info.isMaxLevel

            return (
              <div key={pm.id} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-slate-900"
                    style={{ backgroundColor: template.color }}
                  >
                    {template.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{template.name}</div>
                    <div className="text-xs text-sky-300">Tier {template.tier} · Lv.{level}</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs text-center mb-3">
                  <div className="bg-slate-700/50 rounded-lg p-1.5">
                    <div className="text-slate-400">HP</div>
                    <div className="text-emerald-300 font-medium">{stats.hp}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-1.5">
                    <div className="text-slate-400">ATK</div>
                    <div className="text-red-300 font-medium">{stats.atk}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-1.5">
                    <div className="text-slate-400">DEF</div>
                    <div className="text-blue-300 font-medium">{stats.def}</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-1.5">
                    <div className="text-slate-400">SPD</div>
                    <div className="text-amber-300 font-medium">{stats.speed}</div>
                  </div>
                </div>

                {!isMaxLevel && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>XP to next level</span>
                      <span>{info.xpIntoLevel}/{info.xpForNext}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-sky-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (info.xpIntoLevel / info.xpForNext) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {isMaxLevel && (
                  <div className="text-xs text-amber-400 text-center">MAX LEVEL</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
