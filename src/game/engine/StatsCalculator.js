const LEVEL_HP_SCALE = 12
const LEVEL_ATK_SCALE = 3
const LEVEL_DEF_SCALE = 2
const LEVEL_SPEED_SCALE = 2

export function calcStats(template, level) {
  return {
    hp: Math.round(template.baseHp + LEVEL_HP_SCALE * (level - 1)),
    maxHp: Math.round(template.baseHp + LEVEL_HP_SCALE * (level - 1)),
    atk: Math.round(template.baseAtk + LEVEL_ATK_SCALE * (level - 1)),
    def: Math.round(template.baseDef + LEVEL_DEF_SCALE * (level - 1)),
    range: template.baseRange,
    speed: template.baseSpeed + LEVEL_SPEED_SCALE * (level - 1),
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

export function xpForLevel(level) {
  return 50 * level * (level + 1)
}
