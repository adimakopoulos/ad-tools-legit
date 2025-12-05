// src/pages/AchievementsPage.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import confetti from 'canvas-confetti'

export default function AchievementsPage() {
  const { session } = useAuth()
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    fulfilling: 3,
    happy: 3,
    accomplished: 3,
  })

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    fulfilling: 3,
    happy: 3,
    accomplished: 3,
  })

  const userId = session?.user?.id

  useEffect(() => {
    if (!userId) return
    load()
  }, [userId])

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    setAchievements(data || [])
    setLoading(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return

    const payload = {
      user_id: userId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      fulfilling: Number(form.fulfilling),
      happy: Number(form.happy),
      accomplished: Number(form.accomplished),
      // tags and analysis can be basic – here we keep it simple
      tags: generateTags(form.title, form.description),
    }

    const { data, error } = await supabase
      .from('achievements')
      .insert(payload)
      .select('*')
      .single()
    if (error) {
      console.error(error)
      return
    }

    setAchievements(prev => [data, ...prev])
    setForm({
      title: '',
      description: '',
      fulfilling: 3,
      happy: 3,
      accomplished: 3,
    })

    fireConfetti()
    playSuccessSound()
  }

  const startEdit = (ach) => {
    setEditingId(ach.id)
    setEditForm({
      title: ach.title,
      description: ach.description || '',
      fulfilling: ach.fulfilling,
      happy: ach.happy,
      accomplished: ach.accomplished,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({
      title: '',
      description: '',
      fulfilling: 3,
      happy: 3,
      accomplished: 3,
    })
  }

  const saveEdit = async (ach) => {
    const payload = {
      title: editForm.title.trim(),
      description: editForm.description.trim() || null,
      fulfilling: Number(editForm.fulfilling),
      happy: Number(editForm.happy),
      accomplished: Number(editForm.accomplished),
      // leave tags as-is in DB; they were set at creation time
    }
    const { data, error } = await supabase
      .from('achievements')
      .update(payload)
      .eq('id', ach.id)
      .select('*')
      .single()
    if (error) {
      console.error(error)
      return
    }
    setAchievements(prev => prev.map(a => (a.id === ach.id ? data : a)))
    cancelEdit()
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return achievements
    return achievements.filter(a => {
      const text = `${a.title} ${a.description || ''} ${(a.tags || []).join(' ')}`
      return text.toLowerCase().includes(q)
    })
  }, [achievements, search])

  const averages = useMemo(() => {
    if (!achievements.length) return null
    const sum = achievements.reduce(
      (acc, a) => {
        acc.f += a.fulfilling
        acc.h += a.happy
        acc.a += a.accomplished
        return acc
      },
      { f: 0, h: 0, a: 0 },
    )
    return {
      fulfilling: (sum.f / achievements.length).toFixed(1),
      happy: (sum.h / achievements.length).toFixed(1),
      accomplished: (sum.a / achievements.length).toFixed(1),
    }
  }, [achievements])

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.1fr)]">
      <div className="glass rounded-3xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">Achievement tracker</h2>
          <p className="text-xs text-slate-400">
            Add achievements, rate how fulfilling, happy, and accomplished they felt.
            We’ll help you see patterns in your life satisfaction.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-xs text-slate-300">Title</label>
            <input
              className="input mt-1"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">Description</label>
            <textarea
              className="input mt-1 min-h-[80px]"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['fulfilling', 'happy', 'accomplished'].map(key => (
              <div key={key}>
                <label className="text-xs text-slate-300 capitalize">
                  {key}
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-[11px] text-slate-400 mt-1">
                  {form[key]}
                </div>
              </div>
            ))}
          </div>
          <button className="btn-primary w-full">
            Add achievement 🎉
          </button>
        </form>

        {averages && (
          <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 text-xs">
            <div className="font-semibold mb-2">Average feelings</div>
            <div className="flex gap-4">
              <div>Fulfilling: {averages.fulfilling}</div>
              <div>Happy: {averages.happy}</div>
              <div>Accomplished: {averages.accomplished}</div>
            </div>
          </div>
        )}
      </div>

      <div className="glass rounded-3xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Achievements</h3>
          <input
            className="input h-8 text-xs max-w-[180px]"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="text-xs text-slate-400">Loading...</div>
        ) : !filtered.length ? (
          <div className="text-xs text-slate-400">
            No achievements yet. Add your first one!
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map(a => {
              const isEditing = editingId === a.id
              return (
                <li
                  key={a.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 tile-hover text-xs"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        className="input h-8 text-[11px]"
                        value={editForm.title}
                        onChange={e =>
                          setEditForm(f => ({ ...f, title: e.target.value }))
                        }
                      />
                      <textarea
                        className="input min-h-[60px] text-[11px]"
                        value={editForm.description}
                        onChange={e =>
                          setEditForm(f => ({ ...f, description: e.target.value }))
                        }
                      />
                      <div className="grid grid-cols-3 gap-2">
                        {['fulfilling', 'happy', 'accomplished'].map(key => (
                          <div key={key}>
                            <label className="text-[10px] text-slate-300 capitalize">
                              {key}
                            </label>
                            <input
                              type="range"
                              min={1}
                              max={5}
                              value={editForm[key]}
                              onChange={e =>
                                setEditForm(f => ({
                                  ...f,
                                  [key]: Number(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                            <div className="text-[10px] text-slate-400 mt-1">
                              {editForm[key]}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="text-[11px] text-slate-300 hover:text-slate-100"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="text-[11px] text-sky-300 hover:text-sky-100"
                          onClick={() => saveEdit(a)}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-[13px]">
                          {a.title}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(a.created_at).toLocaleString()}
                        </div>
                      </div>
                      {a.description && (
                        <p className="text-[11px] text-slate-300 mb-2">
                          {a.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-[11px] text-slate-400 mb-1">
                        <div>F: {a.fulfilling}</div>
                        <div>H: {a.happy}</div>
                        <div>A: {a.accomplished}</div>
                      </div>
                      {a.tags && a.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 text-[10px] text-slate-400">
                          {a.tags.map(t => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/60"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex justify-end text-[11px] text-slate-400">
                        <button
                          type="button"
                          onClick={() => startEdit(a)}
                          className="hover:text-sky-300"
                        >
                          Edit
                        </button>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function generateTags(title, description) {
  const text = `${title} ${description || ''}`.toLowerCase()
  const base = []
  if (text.includes('family')) base.push('family')
  if (text.includes('work') || text.includes('project')) base.push('work')
  if (text.includes('health') || text.includes('run') || text.includes('gym')) base.push('health')
  if (!base.length) base.push('general')
  return base
}

function fireConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.75 },
    })
  } catch {}
}

function playSuccessSound() {
  try {
    const audio = new Audio('/sounds/success.mp3')
    audio.play().catch(() => {})
  } catch {}
}
