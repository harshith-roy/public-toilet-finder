import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AuthView } from './components/auth/AuthView'
import { CitizenMapView } from './components/map/CitizenMapView'
import { AuthorityDashboard } from './components/authority/AuthorityDashboard'
import { AccessDenied } from './components/authority/AccessDenied'

const MainContent = () => {
  const { user, profile, loading, authState } = useAuth()
  const isAuthority = profile?.role === 'authority'
  const [userSelectedView, setUserSelectedView] = useState<'citizen' | 'authority' | null>(null)

  // Clean derived viewMode: defaults to user's verified role without setState effects
  const activeView = userSelectedView ?? (isAuthority ? 'authority' : 'citizen')

  // While auth session is initializing or profile is loading, show clean session screen
  if (loading || authState === 'INITIALIZING' || authState === 'PROFILE_LOADING') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center">
            <p className="text-slate-800 font-semibold text-sm">
              {authState === 'PROFILE_LOADING'
                ? 'Loading user profile...'
                : 'Checking your session...'}
            </p>
            <p className="text-slate-400 text-xs mt-0.5">Please wait a moment</p>
          </div>
        </div>
      </div>
    )
  }

  // If unauthenticated, render AuthView
  if (!user) {
    return <AuthView />
  }

  // Guard authority view strictly by user's actual profile role
  if (activeView === 'authority') {
    if (!isAuthority) {
      return <AccessDenied onBackToCitizen={() => setUserSelectedView('citizen')} />
    }
    return <AuthorityDashboard onSwitchToCitizenView={() => setUserSelectedView('citizen')} />
  }

  return (
    <CitizenMapView
      onSwitchToAuthority={
        isAuthority ? () => setUserSelectedView('authority') : undefined
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
