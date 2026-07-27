import React, { useEffect, useRef } from 'react'
import { renderGrid, renderUnitOnGrid, CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/Renderer'
import { getTemplate } from '../data/mercenaryTemplates'

export default function EnemyPreview({ arenaEnemies, arena }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    renderGrid(ctx)

    for (const ae of arenaEnemies) {
      const template = getTemplate(ae.templateId)
      if (!template) continue
      renderUnitOnGrid(ctx, template, ae.level, ae.row, ae.col)
    }
  }, [arenaEnemies])

  if (!arenaEnemies || arenaEnemies.length === 0) return null

  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200">Enemy Layout</h3>
        <span className="text-xs text-slate-400">{arenaEnemies.length} enemies</span>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
          width: '100%',
          maxWidth: '320px',
          height: 'auto',
          aspectRatio: '1',
        }}
      />
    </div>
  )
}
