import { calcStats } from './StatsCalculator'

const CELL_SIZE = 80

export function createUnit(template, level, row, col, team, id) {
  const stats = calcStats(template, level)
  return {
    id,
    templateId: template.id,
    name: template.name,
    type: template.type,
    team,
    color: template.color,
    stats,
    row,
    col,
    x: col * CELL_SIZE + CELL_SIZE / 2,
    y: row * CELL_SIZE + CELL_SIZE / 2,
    attackCooldown: 0,
    healCooldown: 0,
    alive: true,
    facingRight: team === 'player',
    state: 'idle',
    damageFlash: 0,
  }
}

function updateAttacker(unit, enemies, deltaTime) {
  let nearest = null
  let nearestDist = Infinity
  for (const enemy of enemies) {
    if (!enemy.alive) continue
    const dx = enemy.x - unit.x
    const dy = enemy.y - unit.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = enemy
    }
  }

  if (!nearest) {
    unit.state = 'idle'
    return
  }

  unit.facingRight = nearest.x > unit.x

  const rangePx = unit.stats.range * CELL_SIZE

  if (nearestDist <= rangePx) {
    unit.state = 'attacking'
    unit.attackCooldown -= deltaTime
    if (unit.attackCooldown <= 0) {
      const dmg = Math.max(1, Math.round(
        unit.stats.atk - nearest.stats.def * 0.3 + (Math.random() * 4 - 2)
      ))
      nearest.stats.hp -= dmg
      nearest.damageFlash = 0.12
      if (nearest.stats.hp <= 0) {
        nearest.stats.hp = 0
        nearest.alive = false
        nearest.state = 'dead'
      }
      unit.attackCooldown = 1.0
    }
  } else {
    unit.state = 'moving'
    const speed = unit.stats.speed * deltaTime
    const dx = nearest.x - unit.x
    const dy = nearest.y - unit.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 0) {
      const mx = (dx / dist) * speed
      const my = (dy / dist) * speed
      if (Math.abs(mx) > Math.abs(dx)) unit.x = nearest.x
      else unit.x += mx
      if (Math.abs(my) > Math.abs(dy)) unit.y = nearest.y
      else unit.y += my
    }
  }
}

function updateHealer(unit, allies, deltaTime) {
  let target = null
  let lowestHpPct = 1
  for (const ally of allies) {
    if (!ally.alive || ally.stats.hp >= ally.stats.maxHp) continue
    const pct = ally.stats.hp / ally.stats.maxHp
    if (pct < lowestHpPct) {
      lowestHpPct = pct
      target = ally
    }
  }

  if (!target) {
    unit.state = 'idle'
    return
  }

  const dx = target.x - unit.x
  const dy = target.y - unit.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  unit.facingRight = target.x > unit.x

  const rangePx = unit.stats.range * CELL_SIZE

  if (dist <= rangePx) {
    unit.state = 'attacking'
    unit.healCooldown -= deltaTime
    if (unit.healCooldown <= 0) {
      const healAmt = Math.round(unit.stats.atk + Math.random() * 4)
      target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + healAmt)
      unit.healCooldown = 1.2
    }
  } else {
    unit.state = 'moving'
    const speed = unit.stats.speed * deltaTime
    if (dist > 0) {
      const mx = (dx / dist) * speed
      const my = (dy / dist) * speed
      if (Math.abs(mx) > Math.abs(dx)) unit.x = target.x
      else unit.x += mx
      if (Math.abs(my) > Math.abs(dy)) unit.y = target.y
      else unit.y += my
    }
  }
}

export function updateUnit(unit, allies, enemies, deltaTime) {
  if (!unit.alive) return

  if (unit.damageFlash > 0) {
    unit.damageFlash -= deltaTime
  }

  if (unit.type === 'healer') {
    updateHealer(unit, allies, deltaTime)
  } else {
    updateAttacker(unit, enemies, deltaTime)
  }
}
