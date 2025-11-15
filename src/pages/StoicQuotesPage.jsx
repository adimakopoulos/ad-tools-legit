import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import Fuse from 'fuse.js'

export default function StoicQuotesPage() {
  const { session } = useAuth()
  const [problems, setProblems] = useState([])
  const [quotesByProblem, setQuotesByProblem] = useState({})
  const [loading, setLoading] = useState(true)

  const [problemName, setProblemName] = useState('')
  const [problemDescription, setProblemDescription] = useState('')
  const [quoteText, setQuoteText] = useState('')
  const [selectedProblemId, setSelectedProblemId] = useState(null)
  const [randomQuote, setRandomQuote] = useState(null)
  const [similarWarning, setSimilarWarning] = useState(null)

  const fuse = useMemo(() => {
    return new Fuse(problems, {
      keys: ['name'],
      threshold: 0.35,
    })
  }, [problems])

  const load = async () => {
    setLoading(true)
    const { data: problemsData, error: pErr } = await supabase
      .from('stoic_problems')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
    if (pErr) console.error(pErr)
    setProblems(problemsData || [])

    const { data: quotesData, error: qErr } = await supabase
      .from('stoic_quotes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
    if (qErr) console.error(qErr)
    const grouped = {}
    ;(quotesData || []).forEach(q => {
      if (!grouped[q.problem_id]) grouped[q.problem_id] = []
      grouped[q.problem_id].push(q)
    })
    setQuotesByProblem(grouped)
    setLoading(false)
  }

  useEffect(() => {
    if (session) load()
  }, [session])

  const handleProblemNameChange = (value) => {
    setProblemName(value)
    if (!value.trim()) {
      setSimilarWarning(null)
      return
    }
    const results = fuse.search(value.trim())
    if (results.length) {
      const best = results[0].item
      setSimilarWarning(`Similar category exists: "${best.name}". Consider reusing it instead of creating a duplicate.`)
    } else {
      setSimilarWarning(null)
    }
  }

  const handleAddProblem = async (e) => {
    e.preventDefault()
    const payload = {
      user_id: session.user.id,
      name: problemName.trim(),
      description: problemDescription.trim() || null,
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
    setProblemName('')
    setProblemDescription('')
    setSimilarWarning(null)
  }

  const handleAddQuote = async (e) => {
    e.preventDefault()
    if (!selectedProblemId) {
      alert('Select a problem first.')
      return
    }
    const payload = {
      user_id: session.user.id,
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
    setQuotesByProblem(prev => ({
      ...prev,
      [selectedProblemId]: [...(prev[selectedProblemId] || []), data],
    }))
    setQuoteText('')
  }

  const handleRandomQuote = (problemId) => {
    const quotes = quotesByProblem[problemId] || []
    if (!quotes.length) {
      setRandomQuote('No quotes yet for this problem.')
      setSelectedProblemId(problemId)
      return
    }
    const q = quotes[Math.floor(Math.random() * quotes.length)]
    setRandomQuote(q.text)
    setSelectedProblemId(problemId)
  }

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
      <div className="glass rounded-3xl p-6">
        <h2 className="text-xl font-semibold mb-2">Problems / vices</h2>
        <p className="text-xs text-slate-400 mb-4">
          Add recurring problems (like &quot;excessive eating&quot; or &quot;social anxiety&quot;) and
          associate stoic quotes that help you act better when temptation appears.
        </p>
        <form onSubmit={handleAddProblem} className="space-y-3 mb-6">
          <div>
            <label className="text-xs text-slate-300">Problem name</label>
            <input
              className="input mt-1"
              required
              value={problemName}
              onChange={e => handleProblemNameChange(e.target.value)}
              placeholder="e.g. Excessive eating"
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">Description (optional)</label>
            <textarea
              className="input mt-1 min-h-[70px]"
              value={problemDescription}
              onChange={e => setProblemDescription(e.target.value)}
            />
          </div>
          {similarWarning && (
            <div className="text-[11px] text-amber-300/90 bg-amber-900/30 border border-amber-500/40 rounded-xl px-3 py-2">
              {similarWarning}
            </div>
          )}
          <button className="btn-primary w-full">
            Add problem
          </button>
        </form>
        <form onSubmit={handleAddQuote} className="space-y-3">
          <div>
            <label className="text-xs text-slate-300">Select problem</label>
            <select
              className="input mt-1"
              value={selectedProblemId || ''}
              onChange={e => setSelectedProblemId(e.target.value || null)}
            >
              <option value="">Pick...</option>
              {problems.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-300">Stoic quote</label>
            <textarea
              className="input mt-1 min-h-[70px]"
              value={quoteText}
              onChange={e => setQuoteText(e.target.value)}
              placeholder="e.g. “We suffer more often in imagination than in reality.” – Seneca"
              required
            />
          </div>
          <button className="btn-primary w-full">
            Attach quote
          </button>
        </form>
      </div>
      <div className="space-y-4">
        <div className="glass rounded-3xl p-4 max-h-[45vh] overflow-auto">
          <h3 className="text-sm font-semibold mb-2">Your problems</h3>
          {loading ? (
            <div className="text-xs text-slate-400">Loading...</div>
          ) : !problems.length ? (
            <div className="text-xs text-slate-400">No problems yet. Add one on the left.</div>
          ) : (
            <ul className="space-y-2 text-xs">
              {problems.map(p => (
                <li
                  key={p.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3 tile-hover flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold mb-0.5">{p.name}</div>
                    {p.description && (
                      <div className="text-slate-400 text-[11px] line-clamp-2">
                        {p.description}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 mt-1">
                      Quotes: {(quotesByProblem[p.id] || []).length}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRandomQuote(p.id)}
                    className="text-[11px] text-sky-300 hover:text-sky-200"
                  >
                    Random quote
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="glass rounded-3xl p-4 min-h-[120px]">
          <h3 className="text-sm font-semibold mb-2">Instant stoic nudge</h3>
          <p className="text-xs text-slate-400 mb-2">
            Click a problem above to pull a random quote. Keep this page handy when you anticipate a difficult situation.
          </p>
          <div className="text-sm">
            {randomQuote ? (
              <blockquote className="border-l-2 border-sky-500/70 pl-3 text-slate-100 text-sm">
                {randomQuote}
              </blockquote>
            ) : (
              <span className="text-slate-500 text-xs">
                No quote selected yet.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
