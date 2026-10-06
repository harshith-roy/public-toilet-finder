import React from 'react'
import { useAuth } from '../../context/AuthContext'

interface AccessDeniedProps {
  onBackToCitizen: () => void
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ onBackToCitizen }) => {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">Authority Access Restricted</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            The Authority Dashboard is reserved for municipal staff and maintenance officers. Your account is registered as{' '}
            <span className="font-semibold text-emerald-700 uppercase">{profile?.role || 'Citizen'}</span>.
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
          Row Level Security (RLS) protects all sensitive municipal actions. Citizen accounts cannot inspect or modify facility management logs.
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onBackToCitizen}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
          >
            Return to Citizen Map
          </button>
          <button
            type="button"
            onClick={signOut}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer border border-slate-300"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
