import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { logAdminAction } from '../utils/adminLog'

export default function AdminPage() {
  const { session } = useAuth()
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)

  const [resetUserId, setResetUserId] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('admin_actions')
      .select('*, profiles!admin_actions_admin_id_fkey(email)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) console.error(error)
    setActions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (session) load()
  }, [session])

  const handleReset = async () => {
    const uid = resetUserId.trim()
    if (!uid) return

    setResetMsg(null)
    setResetting(true)

    try {
      const { count: mercsDeleted } = await supabase
        .from('player_mercenaries')
        .delete()
        .eq('user_id', uid)

      const { count: resultsDeleted } = await supabase
        .from('battle_results')
        .delete()
        .eq('user_id', uid)

      const { error: upsertErr } = await supabase
        .from('player_progress')
        .upsert({ user_id: uid, level: 1, total_xp: 0, gold: 200, highest_arena: 0 }, { onConflict: 'user_id' })

      if (upsertErr) throw upsertErr

      await logAdminAction({
        admin_id: session.user.id,
        action_type: 'game_reset',
        entity: 'player',
        entity_id: uid,
        details: `Deleted ${mercsDeleted || 0} mercs, ${resultsDeleted || 0} battle results. Reset progress with 200 gold.`,
      })

      setResetMsg({ ok: true, text: `Reset done. Mercs cleared, 200 gold granted. Mercs deleted: ${mercsDeleted || 0}, results: ${resultsDeleted || 0}.` })
      setResetUserId('')
      load()
    } catch (err) {
      console.error('Reset failed:', err)
      setResetMsg({ ok: false, text: `Reset failed: ${err.message || err}` })
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="glass rounded-3xl p-6">
        <h2 className="text-xl font-semibold mb-2">Admin activity log</h2>
        <p className="text-xs text-slate-400">
          All administrative create / update / delete actions can be logged here for auditing.
        </p>
      </div>

      <div className="glass rounded-3xl p-6">
        <h2 className="text-lg font-semibold mb-3 text-slate-200">Reset Game Progress</h2>
        <p className="text-xs text-slate-400 mb-3">
          Delete all game data (mercenaries, battle results, progress) for a player by user ID.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={resetUserId}
            onChange={e => setResetUserId(e.target.value)}
            placeholder="Enter user UUID..."
            className="input flex-1 font-mono text-xs"
          />
          <button
            onClick={handleReset}
            disabled={!resetUserId.trim() || resetting}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-all"
          >
            {resetting ? 'Resetting...' : 'Reset'}
          </button>
        </div>
        {resetMsg && (
          <p className={`mt-2 text-xs ${resetMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
            {resetMsg.text}
          </p>
        )}
      </div>

      <div className="glass rounded-3xl p-4 max-h-[60vh] overflow-auto">
        {loading ? (
          <div className="text-xs text-slate-400">Loading...</div>
        ) : !actions.length ? (
          <div className="text-xs text-slate-400">No admin actions recorded yet.</div>
        ) : (
          <table className="w-full text-[11px] text-left border-separate border-spacing-y-1">
            <thead className="text-slate-400">
              <tr>
                <th className="px-2 py-1">When</th>
                <th className="px-2 py-1">Admin</th>
                <th className="px-2 py-1">Action</th>
                <th className="px-2 py-1">Entity</th>
                <th className="px-2 py-1">Details</th>
              </tr>
            </thead>
            <tbody>
              {actions.map(a => (
                <tr key={a.id} className="bg-slate-950/60">
                  <td className="px-2 py-1 text-slate-400">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="px-2 py-1">
                    {a.profiles?.email || a.admin_id}
                  </td>
                  <td className="px-2 py-1">{a.action_type}</td>
                  <td className="px-2 py-1">{a.entity}#{a.entity_id}</td>
                  <td className="px-2 py-1 max-w-xs truncate" title={a.details || ''}>
                    {a.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
