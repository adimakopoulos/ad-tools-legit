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
  const [commentForm, setCommentForm] = useState({ goal_id: '', comment: '' })

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

  const handleCreateGoal = async (e) => {
    e.preventDefault()
    if (!goalForm.title.trim() || !goalForm.pillar_id) return
    const start = new Date()
    const startStr = start.toISOString().slice(0, 10)
    const endStr = computeGoalEndDate(start, goalForm.cadence)
    const payload = {
      user_id: userId,
      pillar_id: goalForm.pillar_id,
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
      pillar_id: goalForm.pillar_id,
    })
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentForm.goal_id || !commentForm.comment.trim()) return
    const payload = {
      user_id: userId,
      goal_id: commentForm.goal_id,
      comment: commentForm.comment.trim(),
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
    setCommentForm({ goal_id: commentForm.goal_id, comment: '' })
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
    // we keep history entries; active points are computed by date range
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

  // Per-pillar aggregation of all points & comments (all time)
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
              {pillarStats.map(({ pillar, totalPoints, totalComments, goalCount }) => (
                <li
                  key={pillar.id}
                  className={`rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3 tile-hover cursor-pointer ${
                    selectedPillarId === pillar.id ? 'ring-1 ring-sky-500/70' : ''
                  }`}
                  onClick={() => setSelectedPillarId(pillar.id)}
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
                </li>
              ))}
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
              {/* pillar_id is fixed to selected pillar */}
              <input
                type="hidden"
                value={selectedPillar.id}
                readOnly
              />
              <button
                className="btn-primary w-full"
                onClick={() =>
                  setGoalForm(f => ({ ...f, pillar_id: selectedPillar.id }))
                }
              >
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
                    return (
                      <li
                        key={goal.id}
                        className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 tile-hover"
                      >
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

                        <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
                          <form
                            onSubmit={e => {
                              setCommentForm(f => ({ ...f, goal_id: goal.id }))
                              handleAddComment(e)
                            }}
                            className="flex-1 flex items-center gap-2"
                          >
                            <input
                              className="input h-8 text-[11px]"
                              placeholder="Add a comment about how you progressed..."
                              value={
                                commentForm.goal_id === goal.id
                                  ? commentForm.comment
                                  : ''
                              }
                              onChange={e =>
                                setCommentForm({
                                  goal_id: goal.id,
                                  comment: e.target.value,
                                })
                              }
                            />
                            <button className="btn-primary h-8 px-3 text-[11px]">
                              +1 point
                            </button>
                          </form>
                          <button
                            type="button"
                            onClick={() => handleRestartGoal(goal)}
                            className="text-[11px] text-slate-300 hover:text-sky-300"
                          >
                            Restart period (reset to 0)
                          </button>
                        </div>
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
