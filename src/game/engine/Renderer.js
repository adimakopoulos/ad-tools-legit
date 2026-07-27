export const CELL_SIZE = 80
export const GRID_COLS = 8
export const GRID_ROWS = 8
export const CANVAS_WIDTH = GRID_COLS * CELL_SIZE
export const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE

export function renderGrid(ctx) {
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 1
  for (let r = 0; r <= GRID_ROWS; r++) {
    ctx.beginPath()
    ctx.moveTo(0, r * CELL_SIZE)
    ctx.lineTo(CANVAS_WIDTH, r * CELL_SIZE)
    ctx.stroke()
  }
  for (let c = 0; c <= GRID_COLS; c++) {
    ctx.beginPath()
    ctx.moveTo(c * CELL_SIZE, 0)
    ctx.lineTo(c * CELL_SIZE, CANVAS_HEIGHT)
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(59, 130, 246, 0.06)'
  ctx.fillRect(0, 5 * CELL_SIZE, CANVAS_WIDTH, 3 * CELL_SIZE)

  ctx.fillStyle = 'rgba(239, 68, 68, 0.06)'
  ctx.fillRect(0, 0, CANVAS_WIDTH, 3 * CELL_SIZE)
}

const TYPE_ICONS = {
  spearman: 'S', swordsman: 'W', archer: 'A', shieldbearer: 'B', healer: 'H',
  zombie: 'Z', fast_zombie: 'F', ranged_zombie: 'R', tank_zombie: 'T',
}

export function renderUnit(ctx, unit) {
  if (!unit.alive) return

  const { x, y, color, stats, facingRight, state, damageFlash, type } = unit
  const radius = 28

  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath()
  ctx.ellipse(x + 2, y + 2, radius, radius, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = damageFlash > 0 ? '#ffffff' : color
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = state === 'attacking' ? '#fbbf24' : 'rgba(255,255,255,0.2)'
  ctx.lineWidth = state === 'attacking' ? 3 : 2
  ctx.stroke()

  const dirX = facingRight ? 1 : -1
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.beginPath()
  ctx.moveTo(x + dirX * 22, y)
  ctx.lineTo(x + dirX * 14, y - 7)
  ctx.lineTo(x + dirX * 14, y + 7)
  ctx.fill()

  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(TYPE_ICONS[type] || '?', x, y)

  const barWidth = 50
  const barHeight = 5
  const barX = x - barWidth / 2
  const barY = y - radius - 11
  const hpPct = Math.max(0, stats.hp / stats.maxHp)

  ctx.fillStyle = '#1e293b'
  ctx.fillRect(barX, barY, barWidth, barHeight)

  const hpColor = hpPct > 0.5 ? '#4ade80' : hpPct > 0.25 ? '#facc15' : '#ef4444'
  ctx.fillStyle = hpColor
  ctx.fillRect(barX, barY, barWidth * hpPct, barHeight)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '9px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText(`${stats.hp}`, x, barY - 1)
}

export function renderPreviewGrid(ctx) {
  renderGrid(ctx)
}

export function renderUnitOnGrid(ctx, template, level, row, col) {
  const unit = {
    x: col * CELL_SIZE + CELL_SIZE / 2,
    y: row * CELL_SIZE + CELL_SIZE / 2,
    color: template.color,
    stats: { hp: 0, maxHp: 0 },
    facingRight: true,
    state: 'idle',
    damageFlash: 0,
    alive: true,
    type: template.type,
  }

  const radius = 28
  ctx.fillStyle = template.color
  ctx.globalAlpha = 0.35
  ctx.beginPath()
  ctx.arc(unit.x, unit.y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.fillStyle = '#f1f5f9'
  ctx.font = 'bold 14px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(TYPE_ICONS[template.type] || '?', unit.x, unit.y)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '10px monospace'
  ctx.textBaseline = 'top'
  ctx.fillText(`Lv.${level}`, unit.x, unit.y + radius + 4)
}

const PLACED_OPACITY = 0.3
const HIGHLIGHT_ALPHA = 0.25

export function renderPlacementGrid(ctx, highlights) {
  renderGrid(ctx)

  if (highlights) {
    for (const h of highlights) {
      ctx.fillStyle = `rgba(59, 130, 246, ${HIGHLIGHT_ALPHA})`
      ctx.fillRect(h.col * CELL_SIZE, h.row * CELL_SIZE, CELL_SIZE, CELL_SIZE)
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.strokeRect(h.col * CELL_SIZE, h.row * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    }
  }
}

export function renderPlacedUnit(ctx, template, level, row, col, isSelected) {
  const x = col * CELL_SIZE + CELL_SIZE / 2
  const y = row * CELL_SIZE + CELL_SIZE / 2
  const radius = 28

  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath()
  ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = template.color
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = isSelected ? '#fbbf24' : 'rgba(255,255,255,0.3)'
  ctx.lineWidth = isSelected ? 3 : 2
  ctx.stroke()

  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(TYPE_ICONS[template.type] || '?', x, y)

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '10px monospace'
  ctx.textBaseline = 'top'
  ctx.fillText(`Lv.${level}`, x, y + radius + 4)
}
