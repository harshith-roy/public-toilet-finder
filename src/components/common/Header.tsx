import React from 'react'
import { useAuth } from '../../context/AuthContext'

interface HeaderProps {
  onOpenMyComplaints?: () => void
  complaintCount?: number
  onSwitchToAuthority?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMyComplaints,
  complaintCount,
  onSwitchToAuthority,
}) => {
  const { user, profile, signOut } = useAuth()

  const isAuthority = profile?.role === 'authority'

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h5"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">
            ToiletFinder <span className="text-emerald-600 font-semibold text-xs ml-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">S5 Smart City</span>
          </h1>
          <p className="text-[11px] text-slate-500">Citizen Map & Navigation</p>
        </div>
      </div>

      <div className="flex items-center space-x-2.5">
        {!isAuthority && onOpenMyComplaints && (
          <button
            type="button"
            onClick={onOpenMyComplaints}
            className="text-xs px-3 py-1.5 font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="View my submitted facility complaints"
          >
            <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">My Complaints</span>
            <span className="sm:hidden">Complaints</span>
            {complaintCount !== undefined && complaintCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                {complaintCount}
              </span>
            )}
          </button>
        )}

        {isAuthority && onSwitchToAuthority && (
          <button
            type="button"
            onClick={onSwitchToAuthority}
            className="text-xs px-3 py-1.5 font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Open Authority Dashboard"
          >
            <svg className="w-3.5 h-3.5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="hidden sm:inline">Authority Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </button>
        )}

        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-semibold text-slate-800">
            {profile?.full_name || user?.email?.split('@')[0] || 'Citizen User'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
            {user?.email}
          </span>
        </div>

        <span
          className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full uppercase tracking-wider ${
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
          className="text-xs px-2.5 py-1.5 font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          title="Sign out of session"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
