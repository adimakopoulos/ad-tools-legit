import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const tools = [
  {
    id: 'achievements',
    name: 'Achievement Tracker',
    description: 'Log your wins, rate how they made you feel, and see patterns in your satisfaction.',
    to: '/tools/achievements',
    icon: '🏆',
  },
  {
    id: 'vault',
    name: 'Encryption Vault',
    description: 'Store accounts and passwords with client-side encryption and a master password.',
    to: '/tools/vault',
    icon: '🔐',
  },
  {
    id: 'stoic',
    name: 'Stoic Quotes',
    description: 'Map your problems to stoic quotes and pull a random reminder when needed.',
    to: '/tools/stoic',
    icon: '📜',
  },
]

export default function Dashboard() {
  const { profile } = useAuth()

  return (
    <div className="mt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          Welcome{profile?.email ? `, ${profile.email}` : ''} 👋
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm">
          This is your personal hub. Track meaningful achievements, keep an encrypted password vault, and
          lean on stoic wisdom against everyday vices.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {tools.map(tool => (
          <Link
            key={tool.id}
            to={tool.to}
            className="glass tile-hover rounded-3xl p-5 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-2xl">{tool.icon}</div>
                <div className="text-xs uppercase tracking-wide text-sky-400/80">
                  Tool
                </div>
              </div>
              <h2 className="text-lg font-semibold mb-1 group-hover:text-sky-300">
                {tool.name}
              </h2>
              <p className="text-xs text-slate-400">
                {tool.description}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-sky-300">
              <span>Open</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
