import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { decryptJson, encryptJson } from '../utils/crypto'

export default function VaultPage({ masterKey }) {
  const { session, profile } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ label: '', url: '', username: '', password: '' })
  const [showDecryptedId, setShowDecryptedId] = useState(null)
  const [decryptedCache, setDecryptedCache] = useState({})

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('vault_entries')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    setEntries(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (session) load()
  }, [session])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!masterKey) {
      alert('Unlock your vault via Profile → Master Password first.')
      return
    }
    const secret = {
      label: form.label,
      url: form.url,
      username: form.username,
      password: form.password,
    }
    const { iv, cipher } = await encryptJson(masterKey, secret)
    const payload = {
      user_id: session.user.id,
      iv,
      cipher,
    }
    const { data, error } = await supabase
      .from('vault_entries')
      .insert(payload)
      .select('*')
      .single()
    if (error) {
      console.error(error)
      return
    }
    setEntries(prev => [data, ...prev])
    setForm({ label: '', url: '', username: '', password: '' })
  }

  const reveal = async (entry) => {
    if (!masterKey) {
      alert('Unlock your vault via Profile → Master Password first.')
      return
    }
    if (decryptedCache[entry.id]) {
      setShowDecryptedId(showDecryptedId === entry.id ? null : entry.id)
      return
    }
    try {
      const decoded = await decryptJson(masterKey, entry.iv, entry.cipher)
      setDecryptedCache(prev => ({ ...prev, [entry.id]: decoded }))
      setShowDecryptedId(entry.id)
    } catch (err) {
      console.error(err)
      alert('Failed to decrypt. Is your master password correct?')
    }
  }

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
      <div className="glass rounded-3xl p-6">
        <h2 className="text-xl font-semibold mb-2">Encryption vault</h2>
        <p className="text-xs text-slate-400 mb-4">
          All entries are encrypted in your browser using your master password-derived key. Even
          database access does not allow decryption without that key. If you forget your master password,
          the data is unrecoverable.
        </p>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-xs text-slate-300">Account label</label>
            <input
              className="input mt-1"
              required
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">URL (optional)</label>
            <input
              className="input mt-1"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">Username</label>
            <input
              className="input mt-1"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">Password</label>
            <input
              className="input mt-1"
              type="password"
              required
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
          <button className="btn-primary w-full">
            Save encrypted entry
          </button>
          {!profile?.master_password_hash && (
            <div className="text-[10px] text-amber-300/90">
              Set a master password in your profile first. Without it, you won&apos;t be able to decrypt later.
            </div>
          )}
        </form>
      </div>
      <div className="glass rounded-3xl p-4 max-h-[70vh] overflow-auto">
        <h3 className="text-sm font-semibold mb-2">Your vault entries</h3>
        {loading ? (
          <div className="text-xs text-slate-400">Loading...</div>
        ) : !entries.length ? (
          <div className="text-xs text-slate-400">
            No entries yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {entries.map(e => {
              const decrypted = decryptedCache[e.id]
              const show = showDecryptedId === e.id && decrypted
              return (
                <li
                  key={e.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3 tile-hover"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-semibold">
                      {decrypted?.label || 'Encrypted entry'}
                    </div>
                    <div className="text-slate-500">
                      {new Date(e.created_at).toLocaleString()}
                    </div>
                  </div>
                  {show && decrypted && (
                    <div className="mt-2 text-[11px] space-y-1">
                      {decrypted.url && (
                        <div>
                          <span className="text-slate-400 mr-1">URL:</span>
                          <a
                            className="text-sky-300 underline underline-offset-2"
                            href={decrypted.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {decrypted.url}
                          </a>
                        </div>
                      )}
                      {decrypted.username && (
                        <div>
                          <span className="text-slate-400 mr-1">Username:</span>
                          <span>{decrypted.username}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400 mr-1">Password:</span>
                        <span>{decrypted.password}</span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => reveal(e)}
                    className="mt-3 text-[11px] text-sky-300 hover:text-sky-200"
                  >
                    {show ? 'Hide' : 'Reveal (requires master password)'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
