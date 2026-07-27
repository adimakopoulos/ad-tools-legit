import { useRef, useCallback, useEffect } from 'react'
import { createBattle, updateBattle } from '../engine/BattleManager'
import { renderGrid, renderUnit } from '../engine/Renderer'
import { GameLoop } from '../engine/GameLoop'

export function useGame(canvasRef) {
  const battleRef = useRef(null)
  const loopRef = useRef(null)

  const stopLoop = useCallback(() => {
    if (loopRef.current) {
      loopRef.current.stop()
      loopRef.current = null
    }
  }, [])

  const startBattle = useCallback((placedMercs, arenaEnemies) => {
    stopLoop()
    battleRef.current = createBattle(placedMercs, arenaEnemies)

    const loop = new GameLoop((deltaTime) => {
      const battle = battleRef.current
      if (!battle) return

      updateBattle(battle, deltaTime)

      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        renderGrid(ctx)
        for (const unit of battle.units) {
          renderUnit(ctx, unit)
        }
      }
    })

    loopRef.current = loop
    loop.start()
  }, [stopLoop, canvasRef])

  const renderStatic = useCallback((placedMercs, arenaEnemies) => {
    stopLoop()
    battleRef.current = createBattle(placedMercs, arenaEnemies)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    renderGrid(ctx)
    for (const unit of battleRef.current.units) {
      renderUnit(ctx, unit)
    }
  }, [stopLoop, canvasRef])

  const cleanup = useCallback(() => {
    stopLoop()
    battleRef.current = null
  }, [stopLoop])

  useEffect(() => {
    return () => stopLoop()
  }, [stopLoop])

  return { battleRef, startBattle, renderStatic, cleanup, stopLoop }
}
