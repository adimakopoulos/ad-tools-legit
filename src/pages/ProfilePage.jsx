import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { createMasterSecret, deriveMasterKey } from '../utils/crypto'

export default function ProfilePage({ onMasterKeyReady }) {
  const { session, profile, isVerified } = useAuth()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [masterPassword, setMasterPassword] = useState('')
  const [unlockPassword, setUnlockPassword] = useState('')
  const [unlockMessage, setUnlockMessage] = useState('')

  if (!session) return null

  const handleSetMaster = async (e) => {
    e.preventDefault()
    setMessage('')
    if (!isVerified) {
      setMessage('You need a verified email before setting a master password.')
      return
    }
    if (profile?.master_password_hash) {
      setMessage('Master password already set. It cannot be changed (by design).')
      return
    }
    try {
      setLoading(true)
      const { key, saltB64, hash } = await createMasterSecret(masterPassword)
      const { error } = await supabase
        .from('profiles')
        .update({
          master_password_salt: saltB64,
          master_password_hash: hash,
        })
        .eq('user_id', session.user.id)
      if (error) throw error
      setMessage('Master password set. Store it somewhere safe – it cannot be recovered.')
      onMasterKeyReady?.(key)
      setMasterPassword('')
    } catch (err) {
      console.error(err)
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async (e) => {
    e.preventDefault()
    setUnlockMessage('')
    try {
      const { key, hash } = await deriveMasterKey(unlockPassword, profile.master_password_salt)
      if (hash !== profile.master_password_hash) {
        setUnlockMessage('Wrong master password.')
        return
      }
      setUnlockMessage('Vault unlocked for this session.')
      onMasterKeyReady?.(key)
      setUnlockPassword('')
    } catch (err) {
      console.error(err)
      setUnlockMessage('Failed to derive key.')
    }
  }

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <div className="glass rounded-3xl p-6">
        <h2 className="text-xl font-semibold mb-2">Profile</h2>
        <p className="text-xs text-slate-400 mb-4">
          Basic info from Supabase authentication.
        </p>
        <div className="space-y-2 text-sm">
          <div>
            <div className="text-slate-400 text-xs">Email</div>
            <div>{profile?.email ?? session.user.email}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Email verified</div>
            <div>{isVerified ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Role</div>
            <div>{profile?.role ?? 'user'}</div>
          </div>
        </div>
      </div>
      <div className="glass rounded-3xl p-6">
        <h2 className="text-xl font-semibold mb-2">Master Password</h2>
        <p className="text-xs text-slate-400 mb-4">
          Used to encrypt and decrypt your vault entries. It is never stored in plain text.
          If you forget it, your vault data is lost forever.
        </p>
        {!profile?.master_password_hash ? (
          <form onSubmit={handleSetMaster} className="space-y-3">
            <div>
              <label className="text-xs text-slate-300">New master password</label>
              <input
                type="password"
                className="input mt-1"
                required
                value={masterPassword}
                onChange={e => setMasterPassword(e.target.value)}
              />
            </div>
            <button className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Set master password'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUnlock} className="space-y-3">
            <div>
              <label className="text-xs text-slate-300">Enter master password to unlock vault</label>
              <input
                type="password"
                className="input mt-1"
                required
                value={unlockPassword}
                onChange={e => setUnlockPassword(e.target.value)}
              />
            </div>
            <button className="btn-primary">
              Unlock vault
            </button>
          </form>
        )}
        {(message || unlockMessage) && (
          <div className="mt-3 text-xs text-slate-300 bg-slate-900/60 rounded-xl px-3 py-2">
            {message || unlockMessage}
          </div>
        )}
      </div>
    </div>
  )
}
