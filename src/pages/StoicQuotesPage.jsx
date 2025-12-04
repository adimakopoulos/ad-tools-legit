// src/pages/StoicQuotesPage.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Fuse from 'fuse.js'

export default function StoicQuotesPage() {
  const { session } = useAuth()
  const [problems, setProblems] = useState([])
  const [quotes, setQuotes] = useState([])
  const [selectedProblemId, setSelectedProblemId] = useState(null)
  const [problemForm, setProblemForm] = useState({ title: '', description: '' })
  const [quoteText, setQuoteText] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const [editingProblemId, setEditingProblemId] = useState(null)
  const [problemEditForm, setProblemEditForm] = useState({ title: '', description: '' })

  const [editingQuoteId, setEditingQuoteId] = useState(null)
  const [quoteEditText, setQuoteEditText] = useState('')

  const userId = session?.user?.id

  useEffect(() => {
    if (!userId) return
    load()
  }, [userId])

  const load = async () => {
    setLoading(true)
    const [problemsRes, quotesRes] = await Promise.all([
      supabase
        .from('stoic_problems')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
      supabase
        .from('stoic_quotes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
    ])
    if (problemsRes.error) console.error(problemsRes.error)
    if (quotesRes.error) console.error(quotesRes.error)
    setProblems(problemsRes.data || [])
    setQuotes(quotesRes.data || [])
    if (!selectedProblemId && problemsRes.data && problemsRes.data.length > 0) {
      setSelectedProblemId(problemsRes.data[0].id)
    }
    setLoading(false)
  }

  const fuse = useMemo(() => {
    if (!problems.length) return null
    return new Fuse(problems, {
      keys: ['title', 'description'],
      threshold: 0.3,
    })
  }, [problems])

  const handleCreateProblem = async (e) => {
    e.preventDefault()
    setMessage('')
    if (!problemForm.title.trim()) return
    const title = problemForm.title.trim()

    if (fuse) {
      const results = fuse.search(title)
      if (results.length > 0) {
        const closest = results[0].item
        setMessage(
          `This looks similar to an existing problem: “${closest.title}”. You might want to reuse that instead of creating a duplicate.`,
        )
        return
      }
    }

    const payload = {
      user_id: userId,
      title,
      description: problemForm.description.trim() || null,
    }
    const { data, error } = await supabase
      .from('stoic_problems')
      .insert(payload)
      .select('*')
      .single()
    if (error) {
      console.error(error)
      return
    }
    setProblems(prev => [...prev, data])
    setProblemForm({ title: '', description: '' })
    if (!selectedProblemId) setSelectedProblemId(data.id)
    setMessage('')
  }

  const startEditProblem = (p) => {
    setEditingProblemId(p.id)
    setProblemEditForm({
      title: p.title,
      description: p.description || '',
    })
  }

  const cancelEditProblem = () => {
    setEditingProblemId(null)
    setProblemEditForm({ title: '', description: '' })
  }

  const saveEditProblem = async (p) => {
    const payload = {
      title: problemEditForm.title.trim(),
      description: problemEditForm.description.trim() || null,
    }
    const { data, error } = await supabase
      .from('stoic_problems')
      .update(payload)
      .eq('id', p.id)
      .select('*')
      .single()
    if (error) {
      console.error(error)
      return
    }
    setProblems(prev => prev.map(x => (x.id === p.id ? data : x)))
    cancelEditProblem()
  }

  const handleAddQuote = async (e) => {
    e.preventDefault()
    setMessage('')
    if (!selectedProblemId || !quoteText.trim()) return
    const payload = {
      user_id: userId,
      problem_id: selectedProblemId,
      text: quoteText.trim(),
    }
    const { data, error } = await supabase
      .from('stoic_quotes')
      .insert(payload)
      .select('*')
      .single()
    if (error) {
      console.error(error)
      return
    }
    setQuotes(prev => [...prev, data])
    setQuoteText('')
  }

  const startEditQuote = (q) => {
    setEditingQuoteId(q.id)
    setQuoteEditText(q.text)
  }

  const cancelEditQuote = () => {
    setEditingQuoteId(null)
    setQuoteEditText('')
  }

  const saveEditQuote = async (q) => {
    const payload = { text: quoteEditText.trim() }
    const { data, error } = await supabase
      .from('stoic_quotes')
      .update(payload)
      .eq('id', q.id)
      .select('*')
      .single()
    if (error) {
      console.error(error)
      return
    }
    setQuotes(prev => prev.map(x => (x.id === q.id ? data : x)))
    cancelEditQuote()
  }

  const quotesForSelected = useMemo(() => {
    if (!selectedProblemId) return []
    return quotes.filter(q => q.problem_id === selectedProblemId)
  }, [quotes, selectedProblemId])

  const randomQuote = useMemo(() => {
    if (!quotesForSelected.length) return null
    const idx = Math.floor(Math.random() * quotesForSelected.length)
    return quotesForSelected[idx]
  }, [quotesForSelected])

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="glass rounded-3xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">Stoic quotes</h2>
          <p className="text-xs text-slate-400">
            Map your recurring problems or vices to stoic quotes that help you remember
            how you want to act. Avoid duplicates via smart matching.
          </p>
        </div>

        <form onSubmit={handleCreateProblem} className="space-y-2">
          <div>
            <label className="text-xs text-slate-300">New problem / vice</label>
            <input
              className="input mt-1"
              placeholder="e.g. Excessive eating"
              value={problemForm.title}
              onChange={e => setProblemForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">Description (optional)</label>
            <input
              className="input mt-1"
              placeholder="e.g. I tend to snack mindlessly when stressed"
              value={problemForm.description}
              onChange={e =>
                setProblemForm(f => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <button className="btn-primary w-full">
            Add problem
          </button>
          {message && (
            <div className="mt-2 text-[11px] text-amber-300 bg-amber-500/10 rounded-xl px-3 py-2">
              {message}
            </div>
          )}
        </form>

        <div>
          <h3 className="text-sm font-semibold mb-2">Problems</h3>
          {loading ? (
            <div className="text-xs text-slate-400">Loading...</div>
          ) : !problems.length ? (
            <div className="text-xs text-slate-400">
              No problems yet. Add one above.
            </div>
          ) : (
            <ul className="space-y-2">
              {problems.map(p => {
                const isEditing = editingProblemId === p.id
                return (
                  <li
                    key={p.id}
                    className={`rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3 tile-hover ${
                      selectedProblemId === p.id ? 'ring-1 ring-sky-500/70' : ''
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-2 text-xs">
                        <input
                          className="input h-8 text-[11px]"
                          value={problemEditForm.title}
                          onChange={e =>
                            setProblemEditForm(f => ({ ...f, title: e.target.value }))
                          }
                        />
                        <input
                          className="input h-8 text-[11px]"
                          placeholder="Description"
                          value={problemEditForm.description}
                          onChange={e =>
                            setProblemEditForm(f => ({ ...f, description: e.target.value }))
                          }
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="text-[11px] text-slate-300 hover:text-slate-100"
                            onClick={cancelEditProblem}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="text-[11px] text-sky-300 hover:text-sky-100"
                            onClick={() => saveEditProblem(p)}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedProblemId(p.id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold">{p.title}</div>
                            {p.description && (
                              <div className="text-slate-400 text-[11px]">
                                {p.description}
                              </div>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {
                              quotes.filter(q => q.problem_id === p.id)
                                .length
                            }{' '}
                            quote
                            {quotes.filter(q => q.problem_id === p.id).length === 1
                              ? ''
                              : 's'}
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end text-[11px] text-slate-400">
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              startEditProblem(p)
                            }}
                            className="hover:text-sky-300"
                          >
                            Edit problem
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

      {/* Quotes panel */}
      <div className="glass rounded-3xl p-6 space-y-4">
        {selectedProblemId ? (
          <>
            <div>
              <h3 className="text-sm font-semibold mb-2">Quotes for selected problem</h3>
            </div>

            <form onSubmit={handleAddQuote} className="space-y-2">
              <label className="text-xs text-slate-300">
                Add a quote that helps you avoid this vice or remember your values
              </label>
              <textarea
                className="input min-h-[80px] text-xs"
                value={quoteText}
                onChange={e => setQuoteText(e.target.value)}
              />
              <button className="btn-primary w-full">
                Add quote
              </button>
            </form>

            <div>
              <h4 className="text-sm font-semibold mb-2">All quotes</h4>
              {!quotesForSelected.length ? (
                <div className="text-xs text-slate-400">
                  No quotes yet for this problem.
                </div>
              ) : (
                <ul className="space-y-2 text-xs">
                  {quotesForSelected.map(q => {
                    const isEditing = editingQuoteId === q.id
                    return (
                      <li
                        key={q.id}
                        className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3"
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              className="input min-h-[60px] text-[11px]"
                              value={quoteEditText}
                              onChange={e => setQuoteEditText(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                className="text-[11px] text-slate-300 hover:text-slate-100"
                                onClick={cancelEditQuote}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="text-[11px] text-sky-300 hover:text-sky-100"
                                onClick={() => saveEditQuote(q)}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-[11px] text-slate-200">
                              “{q.text}”
                            </p>
                            <div className="mt-2 flex justify-end text-[11px] text-slate-400">
                              <button
                                type="button"
                                onClick={() => startEditQuote(q)}
                                className="hover:text-sky-300"
                              >
                                Edit quote
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

            <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 text-xs">
              <div className="font-semibold mb-2">Random quote for this problem</div>
              {randomQuote ? (
                <p className="text-slate-200">“{randomQuote.text}”</p>
              ) : (
                <p className="text-slate-400">Add at least one quote to use this.</p>
              )}
            </div>
          </>
        ) : (
          <div className="text-xs text-slate-400">
            Select a problem from the left to view and edit its quotes.
          </div>
        )}
      </div>
    </div>
  )
}
