export const ARENAS = [
  {
    id: 1,
    name: 'Graveyard Shift',
    description: 'A couple of restless dead have wandered in.',
    difficulty: 1,
    minPlayerLevel: 1,
    enemyConfig: {
      type: 'fixed',
      enemies: [
        { templateId: 6, level: 1, row: 0, col: 3 },
        { templateId: 6, level: 1, row: 0, col: 4 },
      ],
    },
  },
  {
    id: 2,
    name: 'Cemetery Road',
    description: 'More of them this time. Watch your flanks.',
    difficulty: 1,
    minPlayerLevel: 1,
    enemyConfig: {
      type: 'fixed',
      enemies: [
        { templateId: 6, level: 2, row: 0, col: 2 },
        { templateId: 6, level: 2, row: 0, col: 5 },
        { templateId: 7, level: 1, row: 1, col: 3 },
      ],
    },
  },
  {
    id: 3,
    name: 'Abandoned Fort',
    description: 'Something big is in there.',
    difficulty: 2,
    minPlayerLevel: 2,
    enemyConfig: {
      type: 'fixed',
      enemies: [
        { templateId: 6, level: 2, row: 0, col: 1 },
        { templateId: 9, level: 1, row: 0, col: 4 },
        { templateId: 7, level: 2, row: 1, col: 2 },
        { templateId: 6, level: 2, row: 1, col: 6 },
      ],
    },
  },
  {
    id: 4,
    name: 'Dark Forest',
    description: 'They have archers now. Plan your approach.',
    difficulty: 2,
    minPlayerLevel: 3,
    enemyConfig: {
      type: 'fixed',
      enemies: [
        { templateId: 6, level: 3, row: 0, col: 1 },
        { templateId: 6, level: 3, row: 0, col: 6 },
        { templateId: 8, level: 2, row: 1, col: 0 },
        { templateId: 8, level: 2, row: 1, col: 7 },
        { templateId: 7, level: 3, row: 2, col: 3 },
      ],
    },
  },
  {
    id: 5,
    name: 'The Gate',
    description: 'The horde is here. This is the final stand.',
    difficulty: 3,
    minPlayerLevel: 4,
    enemyConfig: {
      type: 'fixed',
      enemies: [
        { templateId: 9, level: 3, row: 0, col: 2 },
        { templateId: 8, level: 3, row: 0, col: 5 },
        { templateId: 6, level: 4, row: 1, col: 1 },
        { templateId: 7, level: 4, row: 1, col: 4 },
        { templateId: 8, level: 3, row: 1, col: 6 },
        { templateId: 6, level: 4, row: 2, col: 3 },
      ],
    },
  },
  {
    id: 6,
    name: 'Random Skirmish',
    description: 'A randomly generated horde. Test your mettle.',
    difficulty: 3,
    minPlayerLevel: 3,
    enemyConfig: {
      type: 'generated',
      count: 4,
      minLevel: 1,
      maxLevel: 4,
      types: ['zombie', 'fast_zombie', 'ranged_zombie', 'tank_zombie'],
    },
  },
]

export function generateEnemies(arena) {
  const cfg = arena.enemyConfig
  if (cfg.type === 'fixed') {
    return cfg.enemies.map(e => ({ ...e }))
  }

  const enemies = []
  const usedPositions = new Set()
  const typeMap = { zombie: 6, fast_zombie: 7, ranged_zombie: 8, tank_zombie: 9 }

  for (let i = 0; i < cfg.count; i++) {
    const typeName = cfg.types[Math.floor(Math.random() * cfg.types.length)]
    const templateId = typeMap[typeName]
    const level = cfg.minLevel + Math.floor(Math.random() * (cfg.maxLevel - cfg.minLevel + 1))

    let row, col, key
    do {
      row = Math.floor(Math.random() * 3)
      col = Math.floor(Math.random() * 8)
      key = `${row},${col}`
    } while (usedPositions.has(key))
    usedPositions.add(key)

    enemies.push({ templateId, level, row, col })
  }
  return enemies
}
