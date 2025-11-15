import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { session, profile, isAdmin } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-sky-500/90 shadow-floating shadow-sky-500/60">
            🛠️
          </span>
          <span className="text-lg font-semibold tracking-tight">Life Tools Hub</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {session && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `hidden md:inline-block px-3 py-1 rounded-xl transition-colors ${
                    isActive ? 'bg-sky-500 text-slate-900' : 'hover:bg-slate-800/80'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `hidden md:inline-block px-3 py-1 rounded-xl transition-colors ${
                    isActive ? 'bg-sky-500 text-slate-900' : 'hover:bg-slate-800/80'
                  }`
                }
              >
                Profile
              </NavLink>
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `hidden md:inline-block px-3 py-1 rounded-xl transition-colors ${
                      isActive ? 'bg-emerald-500 text-slate-900' : 'hover:bg-slate-800/80'
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}
              <span className="hidden sm:inline text-slate-400">
                {profile?.email ?? session.user.email}
              </span>
              <button
                onClick={handleLogout}
                className="btn-primary bg-slate-800 hover:bg-slate-700"
              >
                Log out
              </button>
            </>
          )}
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-4 pb-8">
        {children}
      </main>
    </div>
  )
}
