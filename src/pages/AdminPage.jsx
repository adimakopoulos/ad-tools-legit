import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function AdminPage() {
  const { session } = useAuth()
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="mt-6">
      <div className="glass rounded-3xl p-6 mb-4">
        <h2 className="text-xl font-semibold mb-2">Admin activity log</h2>
        <p className="text-xs text-slate-400">
          All administrative create / update / delete actions can be logged here for auditing.
          The sample implementation focuses on logging from the admin tools you wire up.
        </p>
      </div>
      <div className="glass rounded-3xl p-4 max-h-[70vh] overflow-auto">
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
