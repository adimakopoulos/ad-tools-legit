import { createUnit, updateUnit, resolveCollisions } from './UnitController'
import { getTemplate } from '../data/mercenaryTemplates'

export const GRID_ROWS = 8
export const GRID_COLS = 8

export function createBattle(placedMercs, arenaEnemies) {
  const units = []
  let id = 0

  for (const pm of placedMercs) {
    const template = getTemplate(pm.templateId)
    if (!template) continue
    units.push(createUnit(template, pm.level, pm.row, pm.col, 'player', id++))
  }

  for (const ae of arenaEnemies) {
    const template = getTemplate(ae.templateId)
    if (!template) continue
    units.push(createUnit(template, ae.level, ae.row, ae.col, 'enemy', id++))
  }

  return { units, finished: false, won: false, elapsed: 0 }
}

export function updateBattle(state, deltaTime) {
  if (state.finished) return state

  state.elapsed += deltaTime

  const playerUnits = state.units.filter(u => u.team === 'player' && u.alive)
  const enemyUnits = state.units.filter(u => u.team === 'enemy' && u.alive)

  if (enemyUnits.length === 0) {
    state.finished = true
    state.won = true
    return state
  }
  if (playerUnits.length === 0) {
    state.finished = true
    state.won = false
    return state
  }
  if (state.elapsed > 60) {
    state.finished = true
    state.won = playerUnits.length >= enemyUnits.length
    return state
  }

  for (const unit of state.units) {
    if (!unit.alive) continue
    const foes = unit.team === 'player' ? enemyUnits : playerUnits
    const friends = unit.team === 'player' ? playerUnits : enemyUnits
    updateUnit(unit, friends, foes, deltaTime)
  }

  resolveCollisions(state.units)

  return state
}
