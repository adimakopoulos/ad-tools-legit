import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { generateTags } from '../utils/tagging'
import confetti from 'canvas-confetti'

const FEEL_FIELDS = [
  { key: 'fulfilling_score', label: 'Fulfilling' },
  { key: 'happiness_score', label: 'Happy' },
  { key: 'accomplished_score', label: 'Accomplished' },
]

export default function AchievementsPage() {
  const { session } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scores, setScores] = useState({
    fulfilling_score: 4,
    happiness_score: 4,
    accomplished_score: 4,
  })
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (session) load()
  }, [session])

  const handleCreate = async (e) => {
    e.preventDefault()
    const tags = Array.from(new Set([
      ...generateTags(title),
      ...generateTags(description),
    ]))
    const payload = {
      user_id: session.user.id,
      title,
      description,
      ...scores,
      tags,
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
    setItems(prev => [data, ...prev])
    setTitle('')
    setDescription('')
    // confetti & sound
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.7 },
    })
    try {
      const audio = new Audio('/sounds/success.mp3')
      audio.play().catch(() => {})
    } catch {
      // ignore
    }
  }

  const filtered = items.filter(item => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      item.title.toLowerCase().includes(s) ||
      (item.description || '').toLowerCase().includes(s) ||
      (item.tags || []).some(t => t.toLowerCase().includes(s))
    )
  })

  const stats = (() => {
    if (!items.length) return null
    const sums = { fulfilling_score: 0, happiness_score: 0, accomplished_score: 0 }
    for (const a of items) {
      for (const f of FEEL_FIELDS) {
        sums[f.key] += a[f.key] || 0
      }
    }
    const totals = {}
    for (const f of FEEL_FIELDS) {
      totals[f.key] = (sums[f.key] / items.length).toFixed(1)
    }
    return totals
  })()

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
      <div className="glass rounded-3xl p-6">
        <h2 className="text-xl font-semibold mb-2">Add achievement</h2>
        <p className="text-xs text-slate-400 mb-4">
          Capture something you did and how it made you feel. We&apos;ll infer rough themes based on your text.
        </p>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs text-slate-300">Title</label>
            <input
              className="input mt-1"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">Description</label>
            <textarea
              className="input mt-1 min-h-[90px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {FEEL_FIELDS.map(field => (
              <div key={field.key}>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>{field.label}</span>
                  <span className="text-slate-400">{scores[field.key]}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={scores[field.key]}
                  onChange={e =>
                    setScores(prev => ({ ...prev, [field.key]: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </div>
            ))}
          </div>
          <button className="btn-primary w-full">
            Save achievement 🎉
          </button>
        </form>
      </div>
      <div className="space-y-4">
        <div className="glass rounded-3xl p-4 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs text-slate-300 mb-1">Search</div>
            <input
              className="input"
              placeholder="Search by text or tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {stats && (
            <div className="text-xs text-slate-300 space-y-1 w-40">
              <div className="font-semibold">Averages</div>
              <div>Fulfilling: {stats.fulfilling_score}</div>
              <div>Happy: {stats.happiness_score}</div>
              <div>Accomplished: {stats.accomplished_score}</div>
            </div>
          )}
        </div>
        <div className="glass rounded-3xl p-4 max-h-[65vh] overflow-auto">
          {loading ? (
            <div className="text-xs text-slate-400">Loading...</div>
          ) : !filtered.length ? (
            <div className="text-xs text-slate-400">
              No achievements yet. Start by logging one on the left.
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map(a => (
                <li
                  key={a.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3 tile-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold mb-1">{a.title}</div>
                      <div className="text-xs text-slate-400 whitespace-pre-line">
                        {a.description}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 text-right">
                      {new Date(a.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-2 text-[10px] text-slate-300">
                      {FEEL_FIELDS.map(f => (
                        <span key={f.key} className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700">
                          {f.label}: {a[f.key]}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end text-[9px] text-sky-300">
                      {(a.tags || []).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/40"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
