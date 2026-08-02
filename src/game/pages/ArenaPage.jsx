import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import { ARENAS, generateEnemies } from '../data/arenas'
import { getTemplate } from '../data/mercenaryTemplates'
import { usePlayerRoster } from '../hooks/usePlayerRoster'
import { usePlayerProgress } from '../hooks/usePlayerProgress'
import { useGame } from '../hooks/useGame'
import { calcXpPerKill, calcGoldReward } from '../engine/StatsCalculator'
import { CELL_SIZE, renderGrid, renderUnitOnGrid, renderPlacedUnit } from '../engine/Renderer'
import GameCanvas from '../components/GameCanvas'
import TeamRoster from '../components/TeamRoster'
import ArenaSelect from '../components/ArenaSelect'
import BattleResults from '../components/BattleResults'

const MAX_PLACE = 5

export default function ArenaPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const placementCanvasRef = useRef(null)
  const { roster } = usePlayerRoster()
  const { progress, addXp, addGold, unlockArena } = usePlayerProgress()
  const { battleRef, startBattle, cleanup } = useGame(placementCanvasRef)

  const [phase, setPhase] = useState('select')
  const [selectedArena, setSelectedArena] = useState(null)
  const [arenaEnemies, setArenaEnemies] = useState([])
  const [placedMercs, setPlacedMercs] = useState([])
  const [selectedMercId, setSelectedMercId] = useState(null)
  const [battleResult, setBattleResult] = useState(null)
  const [saving, setSaving] = useState(false)

  const hasNextArena = selectedArena && ARENAS.some(a => a.id === selectedArena.id + 1)

  const handleSelectArena = useCallback((arena) => {
    const enemies = generateEnemies(arena)
    setSelectedArena(arena)
    setArenaEnemies(enemies)
    setPlacedMercs([])
    setSelectedMercId(null)
    setBattleResult(null)
    setPhase('placement')
  }, [])

  const goBackToSelect = useCallback(() => {
    cleanup()
    setSelectedArena(null)
    setArenaEnemies([])
    setPlacedMercs([])
    setSelectedMercId(null)
    setBattleResult(null)
    setPhase('select')
  }, [cleanup])

  const renderPlacement = useCallback(() => {
    const canvas = placementCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    renderGrid(ctx)

    for (const ae of arenaEnemies) {
      const template = getTemplate(ae.templateId)
      if (template) renderUnitOnGrid(ctx, template, ae.level, ae.row, ae.col)
    }

    const highlightCells = []
    if (selectedMercId) {
      for (let r = 5; r <= 7; r++) {
        for (let c = 0; c < 8; c++) {
          if (!placedMercs.some(p => p.row === r && p.col === c)) {
            highlightCells.push({ row: r, col: c })
          }
        }
      }
    }

    if (highlightCells.length > 0) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.12)'
      for (const h of highlightCells) {
        ctx.fillRect(h.col * CELL_SIZE, h.row * CELL_SIZE, CELL_SIZE, CELL_SIZE)
      }
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      for (const h of highlightCells) {
        ctx.strokeRect(h.col * CELL_SIZE, h.row * CELL_SIZE, CELL_SIZE, CELL_SIZE)
      }
      ctx.setLineDash([])
    }

    for (const pm of placedMercs) {
      const template = getTemplate(pm.templateId)
      if (template) {
        renderPlacedUnit(ctx, template, pm.level, pm.row, pm.col, false)
      }
    }
  }, [arenaEnemies, placedMercs, selectedMercId])

  useEffect(() => {
    if (phase === 'placement') {
      renderPlacement()
    }
  }, [phase, renderPlacement])

  const handleCanvasClick = useCallback((e) => {
    if (phase !== 'placement' || !selectedMercId) return

    const canvas = placementCanvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const col = Math.floor(x / CELL_SIZE)
    const row = Math.floor(y / CELL_SIZE)

    if (row < 5 || row > 7 || col < 0 || col > 7) return

    const existing = placedMercs.findIndex(p => p.row === row && p.col === col)
    if (existing >= 0) {
      setPlacedMercs(prev => prev.filter((_, i) => i !== existing))
      return
    }

    if (placedMercs.length >= MAX_PLACE) return

    const selectedMerc = roster.find(pm => pm.id === selectedMercId)
    if (!selectedMerc) return

    if (placedMercs.some(p => p.id === selectedMerc.id)) return

    setPlacedMercs(prev => [...prev, {
      id: selectedMerc.id,
      templateId: selectedMerc.template_id,
      level: selectedMerc.level,
      row,
      col,
    }])
    setSelectedMercId(null)
  }, [phase, selectedMercId, placedMercs, roster])

  const handleCanvasRightClick = useCallback((e) => {
    e.preventDefault()
    if (phase !== 'placement') return

    const canvas = placementCanvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const col = Math.floor(x / CELL_SIZE)
    const row = Math.floor(y / CELL_SIZE)

    setPlacedMercs(prev => prev.filter(p => !(p.row === row && p.col === col)))
  }, [phase])

  const handleStartBattle = useCallback(() => {
    if (placedMercs.length === 0) return
    setPhase('battle')
    setBattleResult(null)
  }, [placedMercs])

  useEffect(() => {
    if (phase !== 'battle') return
    startBattle(placedMercs, arenaEnemies)
    return () => cleanup()
  }, [phase, placedMercs, arenaEnemies, startBattle, cleanup])

  useEffect(() => {
    if (phase !== 'battle') return

    const id = setInterval(async () => {
      const battle = battleRef.current
      if (battle?.finished) {
        clearInterval(id)

        const playerUnits = battle.units.filter(u => u.team === 'player')
        const aliveUnits = playerUnits.filter(u => u.alive)
        const deadEnemies = battle.units.filter(u => u.team === 'enemy' && !u.alive)

        const totalXpFromKills = deadEnemies.reduce((sum, e) => sum + calcXpPerKill(e.level), 0)

        const result = {
          won: battle.won,
          mercsLost: playerUnits.length - aliveUnits.length,
          totalMercs: playerUnits.length,
          elapsed: battle.elapsed,
          xpGained: totalXpFromKills,
        }

        setBattleResult(result)
        setPhase('result')

        const goldGained = calcGoldReward(selectedArena.difficulty, battle.won)

        setSaving(true)
        try {
          if (session?.user) {
            await supabase.from('battle_results').insert({
              user_id: session.user.id,
              arena_id: selectedArena.id,
              won: battle.won,
              mercs_lost: playerUnits.length - aliveUnits.length,
              xp_gained: totalXpFromKills,
            })

            await addXp(totalXpFromKills)
            await addGold(goldGained)

            if (battle.won) {
              await unlockArena(selectedArena.id)
            }

            const xpPerMerc = placedMercs.length > 0
              ? Math.round(totalXpFromKills / placedMercs.length)
              : 0

            for (const pm of placedMercs) {
              const found = roster.find(r => r.id === pm.id)
              if (found) {
                const newXp = (found.xp || 0) + xpPerMerc
                await supabase
                  .from('player_mercenaries')
                  .update({ xp: newXp })
                  .eq('id', found.id)
              }
            }
          }
        } catch (err) {
          console.error('Failed to save results:', err)
        } finally {
          setSaving(false)
        }
      }
    }, 150)

    return () => clearInterval(id)
  }, [phase, selectedArena, addXp, addGold, unlockArena, battleRef, session, roster, placedMercs])

  const handleRetry = useCallback(() => {
    cleanup()
    setPlacedMercs([])
    setSelectedMercId(null)
    setBattleResult(null)
    setPhase('placement')
  }, [cleanup])

  const handleNextArena = useCallback(() => {
    if (!hasNextArena) return
    const nextArena = ARENAS.find(a => a.id === selectedArena.id + 1)
    if (nextArena) {
      handleSelectArena(nextArena)
    }
  }, [hasNextArena, selectedArena, handleSelectArena])

  if (phase === 'select') {
    return (
      <div className="mt-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/game')}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            &larr; Game Menu
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-200">Arenas</h1>
        </div>
        <ArenaSelect progress={progress} onSelect={handleSelectArena} />
      </div>
    )
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/game')}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            &larr; Game Menu
          </button>
          <h2 className="text-lg font-semibold text-slate-200">{selectedArena?.name}</h2>
          <div className="flex gap-0.5">
            {[1, 2, 3].map(s => (
              <span key={s} className={`text-xs ${s <= (selectedArena?.difficulty ?? 0) ? 'text-amber-400' : 'text-slate-600'}`}>
                ★
              </span>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-400">
          Player Lv.{progress?.level ?? 1}
        </div>
      </div>

      {phase === 'placement' && (
        <p className="text-xs text-slate-400 mb-4">
          Click a mercenary from your roster, then click a blue-highlighted cell to place them.
          Click a placed merc to remove it. Place {placedMercs.length}/{MAX_PLACE}.
        </p>
      )}

      {phase === 'battle' && (
        <p className="text-xs text-amber-400 mb-4">
          Battle in progress... {saving ? '(saving...)' : ''}
        </p>
      )}

      <div className={phase === 'placement' ? 'flex flex-col items-center gap-4' : 'flex justify-center'}>
        <div className="flex justify-center">
          <GameCanvas
            canvasRef={placementCanvasRef}
            onClick={phase === 'placement' ? handleCanvasClick : undefined}
            onContextMenu={phase === 'placement' ? handleCanvasRightClick : undefined}
            style={{ width: 'min(85vw, 560px)', height: 'min(85vw, 560px)' }}
          />
        </div>

        {phase === 'placement' && (
          <div className="w-full max-w-[640px]">
            <TeamRoster
              roster={roster}
              selectedMercId={selectedMercId}
              onSelect={setSelectedMercId}
              placedCount={placedMercs.length}
              maxPlace={MAX_PLACE}
              deployedIds={placedMercs.map(p => p.id)}
            />
            <button
              onClick={handleStartBattle}
              disabled={placedMercs.length === 0}
              className={`mt-3 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                placedMercs.length === 0
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-500 text-white'
              }`}
            >
              Start Battle
            </button>
          </div>
        )}
      </div>

      {phase === 'result' && battleResult && (
        <div className="mt-6 max-w-lg mx-auto">
          <BattleResults
            result={battleResult}
            arena={selectedArena}
            onRetry={handleRetry}
            onNextArena={handleNextArena}
            hasNextArena={!!hasNextArena}
          />
        </div>
      )}
    </div>
  )
}
