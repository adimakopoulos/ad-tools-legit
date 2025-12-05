import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

function normalizePersonName(name) {
  return name.trim().toLowerCase()
}

export default function TalkIssuesPage() {
  const { session } = useAuth()
  const userId = session?.user?.id

  const [issues, setIssues] = useState([])
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    person_name: '',
    topic: '',
    description: '',
  })

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    person_name: '',
    topic: '',
    description: '',
  })

  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!userId) return
    loadAll()
  }, [userId])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [issuesRes, peopleRes] = await Promise.all([
        supabase
          .from('talk_issues')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('talk_people')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true }),
      ])

      if (issuesRes.error) console.error('[talk_issues] load issues error:', issuesRes.error)
      if (peopleRes.error) console.error('[talk_people] load people error:', peopleRes.error)

      setIssues(issuesRes.data || [])
      setPeople(peopleRes.data || [])
    } finally {
      setLoading(false)
    }
  }

  // Helper: get existing person or create one
  const getOrCreatePerson = async (rawName) => {
    const cleaned = rawName.trim()
    if (!cleaned) return null
    const normalized = normalizePersonName(cleaned)

    let person = people.find(p => p.normalized_name === normalized)
    if (person) return person

    const { data, error } = await supabase
      .from('talk_people')
      .insert({
        user_id: userId,
        name: cleaned,
        normalized_name: normalized,
      })
      .select('*')
      .single()

    if (error) {
      console.error('[talk_people] insert error:', error)
      throw error
    }

    setPeople(prev => [...prev, data])
    return data
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.person_name.trim() || !form.topic.trim()) return

    try {
      const person = await getOrCreatePerson(form.person_name)
      if (!person) return

      const payload = {
        user_id: userId,
        person_name: person.name,
        person_id: person.id,
        topic: form.topic.trim(),
        description: form.description.trim() || null,
      }

      const { data, error } = await supabase
        .from('talk_issues')
        .insert(payload)
        .select('*')
        .single()

      if (error) {
        console.error('[talk_issues] create error:', error)
        return
      }

      setIssues(prev => [data, ...prev])
      setForm({ person_name: '', topic: '', description: '' })
    } catch (err) {
      console.error(err)
    }
  }

  const startEdit = (issue) => {
    setEditingId(issue.id)
    setEditForm({
      person_name: issue.person_name || '',
      topic: issue.topic,
      description: issue.description || '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ person_name: '', topic: '', description: '' })
  }

  const saveEdit = async (issue) => {
    if (!editForm.person_name.trim() || !editForm.topic.trim()) return

    try {
      const person = await getOrCreatePerson(editForm.person_name)
      if (!person) return

      const payload = {
        person_name: person.name,
        person_id: person.id,
        topic: editForm.topic.trim(),
        description: editForm.description.trim() || null,
      }

      const { data, error } = await supabase
        .from('talk_issues')
        .update(payload)
        .eq('id', issue.id)
        .select('*')
        .single()

      if (error) {
        console.error('[talk_issues] update error:', error)
        return
      }

      setIssues(prev => prev.map(i => (i.id === issue.id ? data : i)))
      cancelEdit()
    } catch (err) {
      console.error(err)
    }
  }

  const setCompleted = async (issue, completed) => {
    const payload = {
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    }

    const { data, error } = await supabase
      .from('talk_issues')
      .update(payload)
      .eq('id', issue.id)
      .select('*')
      .single()

    if (error) {
      console.error('[talk_issues] complete error:', error)
      return
    }

    setIssues(prev => prev.map(i => (i.id === issue.id ? data : i)))
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return issues
    return issues.filter(i => {
      const text = `${i.person_name || ''} ${i.topic} ${i.description || ''}`.toLowerCase()
      return text.includes(q)
    })
  }, [issues, search])

  const openIssues = useMemo(
    () => filtered.filter(i => !i.is_completed),
    [filtered],
  )
  const completedIssues = useMemo(
    () => filtered.filter(i => i.is_completed),
    [filtered],
  )

  // Suggestions for create form
  const personSuggestions = useMemo(() => {
    const q = form.person_name.trim().toLowerCase()
    if (!q) return []
    return people
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 5)
  }, [form.person_name, people])

  // Suggestions for edit form
  const editPersonSuggestions = useMemo(() => {
    const q = editForm.person_name.trim().toLowerCase()
    if (!q) return []
    return people
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 5)
  }, [editForm.person_name, people])

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.1fr)]">
      {/* Left: create + open issues */}
      <div className="glass rounded-3xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">Talk issues</h2>
          <p className="text-xs text-slate-400">
            Keep a list of things you want to talk about with specific people. Names are
            normalised so you don&apos;t end up with multiple variations of the same person.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300">Person</label>
              <input
                className="input mt-1"
                placeholder="e.g. Alex"
                value={form.person_name}
                onChange={e =>
                  setForm(f => ({ ...f, person_name: e.target.value }))
                }
              />
              {personSuggestions.length > 0 && (
                <div className="mt-1 rounded-xl border border-slate-800/80 bg-slate-950/90 text-[11px] max-h-32 overflow-auto">
                  {personSuggestions.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-1 hover:bg-slate-800/80"
                      onClick={() =>
                        setForm(f => ({ ...f, person_name: p.name }))
                      }
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-300">Topic</label>
              <input
                className="input mt-1"
                placeholder="e.g. Weekend plans"
                value={form.topic}
                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-300">Description</label>
            <textarea
              className="input mt-1 min-h-[80px]"
              placeholder="What do you want to ask or talk about?"
              value={form.description}
              onChange={e =>
                setForm(f => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <button className="btn-primary w-full">
            Add talk issue
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">
            Open issues ({openIssues.length})
          </h3>
          <input
            className="input h-8 text-xs max-w-[180px]"
            placeholder="Search person / topic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-xs text-slate-400 mt-2">Loading...</div>
        ) : !openIssues.length ? (
          <div className="text-xs text-slate-400 mt-2">
            No open talk issues. Add something you want to discuss.
          </div>
        ) : (
          <ul className="mt-2 space-y-3">
            {openIssues.map(issue => {
              const isEditing = editingId === issue.id
              return (
                <li
                  key={issue.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 tile-hover text-xs"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            className="input h-8 text-[11px]"
                            value={editForm.person_name}
                            onChange={e =>
                              setEditForm(f => ({
                                ...f,
                                person_name: e.target.value,
                              }))
                            }
                          />
                          {editPersonSuggestions.length > 0 && (
                            <div className="mt-1 rounded-xl border border-slate-800/80 bg-slate-950/90 max-h-24 overflow-auto">
                              {editPersonSuggestions.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  className="w-full text-left px-2 py-1 hover:bg-slate-800/80 text-[11px]"
                                  onClick={() =>
                                    setEditForm(f => ({
                                      ...f,
                                      person_name: p.name,
                                    }))
                                  }
                                >
                                  {p.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <input
                          className="input h-8 text-[11px]"
                          value={editForm.topic}
                          onChange={e =>
                            setEditForm(f => ({
                              ...f,
                              topic: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <textarea
                        className="input min-h-[60px] text-[11px]"
                        value={editForm.description}
                        onChange={e =>
                          setEditForm(f => ({
                            ...f,
                            description: e.target.value,
                          }))
                        }
                      />
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
                          onClick={() => saveEdit(issue)}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-[13px]">
                          {issue.person_name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(issue.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-[11px] text-sky-300 mb-1">
                        {issue.topic}
                      </div>
                      {issue.description && (
                        <p className="text-[11px] text-slate-300 mb-2">
                          {issue.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <button
                          type="button"
                          onClick={() => setCompleted(issue, true)}
                          className="text-emerald-300 hover:text-emerald-100"
                        >
                          Mark as completed
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(issue)}
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

      {/* Right: completed issues */}
      <div className="glass rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">
            Completed issues ({completedIssues.length})
          </h3>
        </div>

        {loading ? (
          <div className="text-xs text-slate-400">Loading...</div>
        ) : !completedIssues.length ? (
          <div className="text-xs text-slate-400">
            Completed talk issues will appear here after you mark them done.
          </div>
        ) : (
          <ul className="space-y-3 text-xs">
            {completedIssues.map(issue => (
              <li
                key={issue.id}
                className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-[13px]">
                    {issue.person_name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {issue.completed_at
                      ? `Completed ${new Date(issue.completed_at).toLocaleString()}`
                      : `Created ${new Date(issue.created_at).toLocaleString()}`}
                  </div>
                </div>
                <div className="text-[11px] text-sky-300 mb-1">
                  {issue.topic}
                </div>
                {issue.description && (
                  <p className="text-[11px] text-slate-300 mb-2">
                    {issue.description}
                  </p>
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCompleted(issue, false)}
                    className="text-[11px] text-slate-300 hover:text-sky-300"
                  >
                    Reopen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
