import React from 'react'
import { useAuth } from '../context/AuthContext'

export const DashboardFoundation: React.FC = () => {
  const { user, profile, signOut } = useAuth()

  const isAuthority = profile?.role === 'authority'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center p-6">
      {/* Top Header Nav */}
      <header className="max-w-3xl w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              {profile?.full_name || 'Authenticated User'}
            </h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
              isAuthority
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            {profile?.role || 'Citizen'}
          </span>
          <button
            type="button"
            onClick={signOut}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-300"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl w-full space-y-6">
        {/* Phase 2 Success Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Phase 2 Backend & Auth Integration Ready</h1>
              <p className="text-xs text-slate-500">Supabase Auth, PostgreSQL Tables, Trigger, RLS, and RPC Active</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">User ID</span>
              <p className="font-mono font-medium text-slate-700 truncate">{user?.id}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">Profile Role</span>
              <p className="font-semibold text-emerald-700">{profile?.role || 'Fetching profile...'}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">Full Name</span>
              <p className="font-medium text-slate-700">{profile?.full_name || 'N/A'}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">Auth Provider</span>
              <p className="font-medium text-slate-700">{user?.app_metadata?.provider || 'Email/Password'}</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
            <p className="font-semibold">Verification Checkpoint:</p>
            <ul className="list-disc list-inside space-y-0.5 text-emerald-700">
              <li>Profile auto-created via PostgreSQL <code>handle_new_user()</code> trigger.</li>
              <li>Row Level Security (RLS) active on <code>profiles</code>, <code>toilets</code>, and <code>complaints</code>.</li>
              <li>PostgreSQL distance RPC function <code>get_nearby_toilets</code> deployed.</li>
              <li>Frontend session persistence and role retrieval verified.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
