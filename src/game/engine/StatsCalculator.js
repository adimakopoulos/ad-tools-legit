export function calcStats(template, level) {
  const scale = 1 + 0.01 * (level - 1)
  return {
    hp: Math.round(template.baseHp * scale),
    maxHp: Math.round(template.baseHp * scale),
    atk: Math.round(template.baseAtk * scale),
    def: Math.round(template.baseDef * scale),
    range: template.baseRange,
    speed: Math.round(template.baseSpeed * scale),
  }
}

export function calcXpReward(arenaDifficulty, mercsAlive, totalMercs, won) {
  let base = 20 + arenaDifficulty * 15
  if (won) {
    const survivalRate = totalMercs > 0 ? mercsAlive / totalMercs : 0
    base += Math.round(survivalRate * 30)
  } else {
    base = Math.round(base * 0.3)
  }
  return base
}

export function calcGoldReward(arenaDifficulty, won) {
  if (!won) return 5 + arenaDifficulty * 3
  return 15 + arenaDifficulty * 10
}

export function xpForLevel(level) {
  return 50 * level * (level + 1)
}

export function calcXpPerKill(enemyLevel) {
  return xpForLevel(Math.max(1, enemyLevel - 1))
}