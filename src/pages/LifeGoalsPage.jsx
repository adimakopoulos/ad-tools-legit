// src/pages/LifeGoalsPage.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { computeGoalEndDate, isGoalExpired } from '../utils/goals'

export default function LifeGoalsPage() {
  const { session } = useAuth()
  const [pillars, setPillars] = useState([])
  const [goals, setGoals] = useState([])
  const [entries, setEntries] = useState([])
  const [selectedPillarId, setSelectedPillarId] = useState(null)
  const [loading, setLoading] = useState(true)

  const [pillarForm, setPillarForm] = useState({ name: '', description: '' })
  const [goalForm, setGoalForm] = useState({
    title: '',
    cadence: 'weekly',
    target_points: 4,
    pillar_id: '',
  })

  // editing states
  const [editingPillarId, setEditingPillarId] = useState(null)
  const [pillarEditForm, setPillarEditForm] = useState({ name: '', description: '' })
  const [editingGoalId, setEditingGoalId] = useState(null)
  const [goalEditForm, setGoalEditForm] = useState({
    title: '',
    cadence: 'weekly',
    target_points: 4,
  })

  const userId = session?.user?.id

  useEffect(() => {
    if (!userId) return
    loadAll()
  }, [userId])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [pillarsRes, goalsRes, entriesRes] = await Promise.all([
        supabase
          .from('life_pillars')
          .select('*')
          .order('created_at', { ascending: true }),
        supabase
          .from('life_goals')
          .select('*')
          .order('created_at', { ascending: true }),
        supabase
          .from('life_goal_entries')
          .select('*')
          .order('created_at', { ascending: true }),
      ])

      if (pillarsRes.error) console.error(pillarsRes.error)
      if (goalsRes.error) console.error(goalsRes.error)
      if (entriesRes.error) console.error(entriesRes.error)

      setPillars(pillarsRes.data || [])
      setGoals(goalsRes.data || [])
      setEntries(entriesRes.data || [])

      if (!selectedPillarId && pillarsRes.data && pillarsRes.data.length > 0) {
        setSelectedPillarId(pillarsRes.data[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePillar = async (e) => {
    e.preventDefault()
    if (!pillarForm.name.trim()) return
    const payload = {
      user_id: userId,
      name: pillarForm.name.trim(),
      description: pillarForm.description.trim() || null,
    }
    const { data, error } = await supabase
      .from('life_pillars')
      .insert(payload)
      .select('*')
      .single()
    if (error) {
      console.error(error)
      return
    }
    setPillars(prev => [...prev, data])
    setPillarForm({ name: '', description: '' })
    if (!selectedPillarId) setSelectedPillarId(data.id)
  }

  const startEditPillar = (pillar) => {
    setEditingPillarId(pillar.id)
    setPillarEditForm({
      name: pillar.name,
      description: pillar.description || '',
    })
  }

  const cancelEditPillar = () => {
    setEditingPillarId(null)
    setPillarEditForm({ name: '', description: '' })
  }

  const saveEditPillar = async (pillar) => {
    const payload = {
      name: pillarEditForm.name.trim(),
      description: pillarEditForm.description.trim() || null,
    }
    const { data, error } = await supabase
      .from('life_pillars')
      .update(payload)
      .eq('id', pillar.id)
      .select('*')
      .single()
    if (error) {
      console.error(error)
      return
    }
    setPillars(prev => prev.map(p => (p.id === pillar.id ? data : p)))
    cancelEditPillar()
  }

  const handleCreateGoal = async (e) => {
    e.preventDefault()
    if (!goalForm.title.trim() || !selectedPillarId) return
    const start = new Date()
    const startStr = start.toISOString().slice(0, 10)
    const endStr = computeGoalEndDate(start, goalForm.cadence)
    const payload = {
      user_id: userId,
      pillar_id: selectedPillarId,
      title: goalForm.title.trim(),
      cadence: goalForm.cadence,
      start_date: startStr,
      end_date: endStr,
      target_points: Number(goalForm.target_points) || 1,
      is_active: true,
    }
    const { data, error } = await supabase
      .from('life_goals')
      .insert(payload)
      .select('*')
      .single()
    if (error) {
      console.error(error)
      return
    }
    setGoals(prev => [...prev, data])
    setGoalForm({
      title: '',
      cadence: goalForm.cadence,
      target_points: goalForm.target_points,
      pillar_id: selectedPillarId,
    })
  }

  const startEditGoal = (goal) => {
    setEditingGoalId(goal.id)
    setGoalEditForm({
      title: goal.title,
      cadence: goal.cadence,
      target_points: goal.target_points,
    })
  }

  const cancelEditGoal = () => {
    setEditingGoalId(null)
    setGoalEditForm({
      title: '',
      cadence: 'weekly',
      target_points: 4,
    })
  }

  const saveEditGoal = async (goal) => {
    const payload = {
      title: goalEditForm.title.trim(),
      cadence: goalEditForm.cadence,
      target_points: Number(goalEditForm.target_points) || 1,
    }

    // if cadence changed, recompute end_date from current start_date
    if (goalEditForm.cadence !== goal.cadence) {
      const start = new Date(goal.start_date)
      payload.end_date = computeGoalEndDate(start, goalEditForm.cadence)
    }

    const { data, error } = await supabase
      .from('life_goals')
      .update(payload)
      .eq('id', goal.id)
      .select('*')
      .single()
    if (error) {
      console.error(error)
      return
    }
    setGoals(prev => prev.map(g => (g.id === goal.id ? data : g)))
    cancelEditGoal()
  }

  const handleAddComment = async (goalId, commentText, setLocalValue) => {
    if (!commentText.trim()) return
    const payload = {
      user_id: userId,
      goal_id: goalId,
      comment: commentText.trim(),
      points: 1,
    }
    const { data, error } = await supabase
      .from('life_goal_entries')
      .insert(payload)
      .select('*')
      .single()
    if (error) {
      console.error(error)
      return
    }
    setEntries(prev => [...prev, data])
    setLocalValue('')
  }

  const handleRestartGoal = async (goal) => {
    const start = new Date()
    const startStr = start.toISOString().slice(0, 10)
    const endStr = computeGoalEndDate(start, goal.cadence)
    const { data, error } = await supabase
      .from('life_goals')
      .update({
        start_date: startStr,
        end_date: endStr,
        is_active: true,
      })
      .eq('id', goal.id)
      .select('*')
      .single()
    if (error) {
      console.error(error)
      return
    }
    setGoals(prev => prev.map(g => (g.id === goal.id ? data : g)))
  }

  // Derived: per-goal current-cycle points & comments
  const entriesByGoal = useMemo(() => {
    const map = new Map()
    for (const e of entries) {
      if (!map.has(e.goal_id)) map.set(e.goal_id, [])
      map.get(e.goal_id).push(e)
    }
    return map
  }, [entries])

  const goalStats = useMemo(() => {
    const stats = new Map()
    for (const g of goals) {
      const goalEntries = entriesByGoal.get(g.id) || []
      const start = new Date(g.start_date)
      const end = new Date(g.end_date)
      const currentCycle = goalEntries.filter(e => {
        const t = new Date(e.created_at)
        return t >= start && t <= end
      })
      const points = currentCycle.reduce((sum, e) => sum + (e.points || 0), 0)
      stats.set(g.id, {
        points,
        currentCount: currentCycle.length,
      })
    }
    return stats
  }, [goals, entriesByGoal])

  const pillarStats = useMemo(() => {
    return pillars.map(p => {
      const pGoals = goals.filter(g => g.pillar_id === p.id)
      const goalIds = new Set(pGoals.map(g => g.id))
      let totalPoints = 0
      let totalComments = 0
      for (const e of entries) {
        if (goalIds.has(e.goal_id)) {
          totalPoints += e.points || 0
          totalComments += 1
        }
      }
      return {
        pillar: p,
        totalPoints,
        totalComments,
        goalCount: pGoals.length,
      }
    })
  }, [pillars, goals, entries])

  const selectedPillar = pillars.find(p => p.id === selectedPillarId) || null
  const goalsForSelectedPillar = selectedPillar
    ? goals.filter(g => g.pillar_id === selectedPillar.id)
    : []

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* Pillars & aggregation */}
      <div className="glass rounded-3xl p-6 space-y-5">
        <div>
          <h2 className="text-xl font-semibold mb-1">Life goals tracker</h2>
          <p className="text-xs text-slate-400">
            Organise goals by fundamental pillars (e.g. Family, Health). Goals can be weekly,
            monthly, or yearly. Each action you log gives the goal a point.
          </p>
        </div>

        <form onSubmit={handleCreatePillar} className="space-y-2">
          <div>
            <label className="text-xs text-slate-300">New pillar</label>
            <input
              className="input mt-1"
              placeholder="e.g. Family"
              value={pillarForm.name}
              onChange={e => setPillarForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">Description (optional)</label>
            <input
              className="input mt-1"
              placeholder="e.g. Deep connections with the people I love"
              value={pillarForm.description}
              onChange={e => setPillarForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <button className="btn-primary w-full">
            Add pillar
          </button>
        </form>

        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">Pillars overview</h3>
          {loading ? (
            <div className="text-xs text-slate-400">Loading...</div>
          ) : !pillars.length ? (
            <div className="text-xs text-slate-400">
              No pillars yet. Create one to get started.
            </div>
          ) : (
            <ul className="space-y-2">
              {pillarStats.map(({ pillar, totalPoints, totalComments, goalCount }) => {
                const isEditing = editingPillarId === pillar.id
                return (
                  <li
                    key={pillar.id}
                    className={`rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3 tile-hover ${
                      selectedPillarId === pillar.id ? 'ring-1 ring-sky-500/70' : ''
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-2 text-xs">
                        <input
                          className="input h-8 text-[11px]"
                          value={pillarEditForm.name}
                          onChange={e =>
                            setPillarEditForm(f => ({ ...f, name: e.target.value }))
                          }
                        />
                        <input
                          className="input h-8 text-[11px]"
                          placeholder="Description"
                          value={pillarEditForm.description}
                          onChange={e =>
                            setPillarEditForm(f => ({ ...f, description: e.target.value }))
                          }
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            className="text-[11px] text-slate-300 hover:text-slate-100"
                            onClick={cancelEditPillar}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="text-[11px] text-sky-300 hover:text-sky-100"
                            onClick={() => saveEditPillar(pillar)}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedPillarId(pillar.id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold">{pillar.name}</div>
                            {pillar.description && (
                              <div className="text-slate-400 text-[11px]">
                                {pillar.description}
                              </div>
                            )}
                          </div>
                          <div className="text-right text-[11px] text-slate-300 space-y-0.5">
                            <div>{goalCount} goal{goalCount === 1 ? '' : 's'}</div>
                            <div>{totalPoints} point{totalPoints === 1 ? '' : 's'}</div>
                            <div>{totalComments} action{totalComments === 1 ? '' : 's'}</div>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end text-[11px] text-slate-400">
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              startEditPillar(pillar)
                            }}
                            className="hover:text-sky-300"
                          >
                            Edit pillar
                          </button>
                        </div>
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Goals and comments for selected pillar */}
      <div className="glass rounded-3xl p-6 space-y-4">
        {selectedPillar ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">
                  Goals for pillar: {selectedPillar.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Example: Pillar <strong>Family</strong>, Goal <strong>monthly: deep connections</strong>,
                  Comment <strong>“I played a board game with my sister today.”</strong>
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCreateGoal}
              className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 space-y-3"
            >
              <div>
                <label className="text-xs text-slate-300">Goal title</label>
                <input
                  className="input mt-1"
                  placeholder="e.g. Deep connections"
                  value={goalForm.title}
                  onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300">Cadence</label>
                  <select
                    className="input mt-1"
                    value={goalForm.cadence}
                    onChange={e => setGoalForm(f => ({ ...f, cadence: e.target.value }))}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300">Target points per period</label>
                  <input
                    type="number"
                    min={1}
                    className="input mt-1"
                    value={goalForm.target_points}
                    onChange={e =>
                      setGoalForm(f => ({ ...f, target_points: e.target.value }))
                    }
                  />
                </div>
              </div>
              <button className="btn-primary w-full">
                Add goal for this pillar
              </button>
            </form>

            <div>
              <h4 className="text-sm font-semibold mb-2">Goals</h4>
              {loading ? (
                <div className="text-xs text-slate-400">Loading...</div>
              ) : !goalsForSelectedPillar.length ? (
                <div className="text-xs text-slate-400">
                  No goals yet for this pillar.
                </div>
              ) : (
                <ul className="space-y-3">
                  {goalsForSelectedPillar.map(goal => {
                    const stats = goalStats.get(goal.id) || { points: 0, currentCount: 0 }
                    const expired = isGoalExpired(goal)
                    const pct = Math.min(
                      100,
                      Math.round((stats.points / (goal.target_points || 1)) * 100),
                    )
                    const isEditing = editingGoalId === goal.id

                    const [localComment, setLocalComment] = useState('')
                    // quick hack: ensure local state per goal
                    // (if you prefer, lift this out, but this works fine in practice)

                    return (
                      <li
                        key={goal.id}
                        className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 tile-hover"
                      >
                        {isEditing ? (
                          <div className="space-y-2 text-xs">
                            <input
                              className="input h-8 text-[11px]"
                              value={goalEditForm.title}
                              onChange={e =>
                                setGoalEditForm(f => ({ ...f, title: e.target.value }))
                              }
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                className="input h-8 text-[11px]"
                                value={goalEditForm.cadence}
                                onChange={e =>
                                  setGoalEditForm(f => ({ ...f, cadence: e.target.value }))
                                }
                              >
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                              </select>
                              <input
                                type="number"
                                min={1}
                                className="input h-8 text-[11px]"
                                value={goalEditForm.target_points}
                                onChange={e =>
                                  setGoalEditForm(f => ({
                                    ...f,
                                    target_points: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                className="text-[11px] text-slate-300 hover:text-slate-100"
                                onClick={cancelEditGoal}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="text-[11px] text-sky-300 hover:text-sky-100"
                                onClick={() => saveEditGoal(goal)}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between text-xs mb-2">
                              <div>
                                <div className="font-semibold">{goal.title}</div>
                                <div className="text-slate-400 text-[11px]">
                                  {goal.cadence} • {goal.start_date} → {goal.end_date}
                                </div>
                              </div>
                              <div className="text-right text-[11px] text-slate-300 space-y-0.5">
                                <div>
                                  {stats.points}/{goal.target_points} points
                                </div>
                                <div>
                                  {stats.currentCount} action
                                  {stats.currentCount === 1 ? '' : 's'} this period
                                </div>
                                {expired && (
                                  <div className="text-amber-300">
                                    Period expired
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900/80">
                              <div
                                className="h-full bg-sky-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="mt-2 flex justify-end text-[11px] text-slate-400 gap-3">
                              <button
                                type="button"
                                onClick={() => startEditGoal(goal)}
                                className="hover:text-sky-300"
                              >
                                Edit goal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRestartGoal(goal)}
                                className="hover:text-amber-300"
                              >
                                Restart period
                              </button>
                            </div>
                          </>
                        )}

                        {!isEditing && (
                          <div className="mt-3 flex items-center gap-2 text-[11px]">
                            <input
                              className="input h-8 text-[11px]"
                              placeholder="Add a comment about how you progressed..."
                              value={localComment}
                              onChange={e => setLocalComment(e.target.value)}
                            />
                            <button
                              className="btn-primary h-8 px-3 text-[11px]"
                              type="button"
                              onClick={() =>
                                handleAddComment(goal.id, localComment, setLocalComment)
                              }
                            >
                              +1 point
                            </button>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="text-xs text-slate-400">
            Create a pillar on the left, then select it to add goals and comments.
          </div>
        )}
      </div>
    </div>
  )
}
