import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AuthView } from './components/auth/AuthView'
import { CitizenMapView } from './components/map/CitizenMapView'
import { AuthorityDashboard } from './components/authority/AuthorityDashboard'
import { AccessDenied } from './components/authority/AccessDenied'

const MainContent = () => {
  const { user, profile, loading } = useAuth()
  const [viewMode, setViewMode] = useState<'citizen' | 'authority'>('citizen')

  // Default authority users to authority view; ensure citizens default to citizen view
  useEffect(() => {
    const timer = setTimeout(() => {
      if (profile?.role === 'authority') {
        setViewMode('authority')
      } else {
        setViewMode('citizen')
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [profile?.role])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center space-x-3 text-emerald-600 font-medium text-sm">
          <svg className="animate-spin h-5 w-5 text-emerald-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading authentication session...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthView />
  }

  // Guard authority view strictly by user's actual profile role
  if (viewMode === 'authority') {
    if (profile?.role !== 'authority') {
      return <AccessDenied onBackToCitizen={() => setViewMode('citizen')} />
    }
    return <AuthorityDashboard onSwitchToCitizenView={() => setViewMode('citizen')} />
  }

  return (
    <CitizenMapView
      onSwitchToAuthority={
        profile?.role === 'authority' ? () => setViewMode('authority') : undefined
      }
    />
  )
}

function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  )
}

export default App
