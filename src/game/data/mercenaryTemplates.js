export const MERCENARY_TEMPLATES = [
  { id: 1, name: 'Spearman', type: 'spearman', baseHp: 100, baseAtk: 15, baseDef: 8, baseRange: 1, baseSpeed: 80, color: '#4ade80', description: 'Balanced melee fighter' },
  { id: 2, name: 'Swordsman', type: 'swordsman', baseHp: 70, baseAtk: 25, baseDef: 5, baseRange: 1, baseSpeed: 110, color: '#facc15', description: 'Fast, high damage, fragile' },
  { id: 3, name: 'Archer', type: 'archer', baseHp: 60, baseAtk: 18, baseDef: 3, baseRange: 3, baseSpeed: 70, color: '#60a5fa', description: 'Ranged attacker, weak up close' },
  { id: 4, name: 'Shieldbearer', type: 'shieldbearer', baseHp: 150, baseAtk: 8, baseDef: 18, baseRange: 1, baseSpeed: 60, color: '#fb923c', description: 'High HP and defense' },
  { id: 5, name: 'Healer', type: 'healer', baseHp: 80, baseAtk: 5, baseDef: 4, baseRange: 2, baseSpeed: 75, color: '#a78bfa', description: 'Heals nearby allies' },
]

export const ENEMY_TEMPLATES = [
  { id: 6, name: 'Zombie', type: 'zombie', baseHp: 100, baseAtk: 12, baseDef: 5, baseRange: 1, baseSpeed: 60, color: '#86efac', description: 'Slow, durable undead' },
  { id: 7, name: 'Fast Zombie', type: 'fast_zombie', baseHp: 60, baseAtk: 8, baseDef: 3, baseRange: 1, baseSpeed: 100, color: '#fde68a', description: 'Quick but fragile' },
  { id: 8, name: 'Ranged Zombie', type: 'ranged_zombie', baseHp: 50, baseAtk: 15, baseDef: 2, baseRange: 3, baseSpeed: 55, color: '#93c5fd', description: 'Throws bones from afar' },
  { id: 9, name: 'Tank Zombie', type: 'tank_zombie', baseHp: 180, baseAtk: 6, baseDef: 15, baseRange: 1, baseSpeed: 40, color: '#fdba74', description: 'Extremely tough' },
]

export const ALL_TEMPLATES = [...MERCENARY_TEMPLATES, ...ENEMY_TEMPLATES]

export function getTemplate(id) {
  return ALL_TEMPLATES.find(t => t.id === id)
}