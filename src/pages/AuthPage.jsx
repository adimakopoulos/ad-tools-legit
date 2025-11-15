import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

export default function AuthPage() {
  const { session } = useAuth()
  const [mode, setMode] = useState('login') // login | register | reset
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setMessage('Logged in!')
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMessage('Check your email to verify your account.')
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        })
        if (error) throw error
        setMessage('Password reset email sent.')
      }
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="glass rounded-3xl p-8 w-full max-w-md shadow-floating shadow-sky-500/40">
        <h1 className="text-2xl font-semibold mb-2 text-center">
          {mode === 'login' && 'Welcome back'}
          {mode === 'register' && 'Create your account'}
          {mode === 'reset' && 'Recover password'}
        </h1>
        <p className="text-sm text-slate-400 mb-6 text-center">
          Your private hub for achievements, encrypted vault, and stoic quotes.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300">Email</label>
            <input
              className="input mt-1"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          {mode !== 'reset' && (
            <div>
              <label className="text-sm text-slate-300">Password</label>
              <input
                className="input mt-1"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          )}
          {message && (
            <div className="text-xs text-slate-300 bg-slate-900/60 rounded-xl px-3 py-2">
              {message}
            </div>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Please wait...' : (
              mode === 'login' ? 'Log in' :
              mode === 'register' ? 'Register' :
              'Send reset email'
            )}
          </button>
        </form>
        <div className="mt-4 flex flex-col gap-2 text-xs text-slate-400">
          {mode !== 'login' && (
            <button onClick={() => setMode('login')} className="underline-offset-2 hover:underline">
              Already have an account? Log in
            </button>
          )}
          {mode !== 'register' && (
            <button onClick={() => setMode('register')} className="underline-offset-2 hover:underline">
              New here? Create an account
            </button>
          )}
          {mode !== 'reset' && (
            <button onClick={() => setMode('reset')} className="underline-offset-2 hover:underline">
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
