import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) {
      setMessage('Invalid or expired reset link.')
      return
    }

    const params = new URLSearchParams(hash.replace('#', ''))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (type !== 'recovery' || !accessToken) {
      setMessage('Invalid or expired reset link.')
      return
    }

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setMessage(error.message)
        } else {
          setReady(true)
          window.history.replaceState(null, '', '/reset-password')
        }
      })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setMessage('Password updated successfully!')
      setTimeout(() => navigate('/auth'), 2000)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="glass rounded-3xl p-8 w-full max-w-md shadow-floating shadow-sky-500/40">
        <h1 className="text-2xl font-semibold mb-2 text-center">Set new password</h1>
        <p className="text-sm text-slate-400 mb-6 text-center">
          Enter your new password below.
        </p>

        {!ready && !message && <p className="text-sm text-slate-300 text-center">Verifying link...</p>}

        {message && (
          <div className="text-xs text-slate-300 bg-slate-900/60 rounded-xl px-3 py-2 mb-4">
            {message}
          </div>
        )}

        {ready && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-300">New password</label>
              <input
                className="input mt-1"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
