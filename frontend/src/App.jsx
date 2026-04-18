import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import MyTeamsPage from './pages/MyTeamsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import RulesPage from './pages/RulesPage'
import HistoryPage from './pages/HistoryPage'
import CupRacePage from './pages/CupRacePage'
import AdminPage from './pages/AdminPage'
import Layout from './components/Layout'
import './App.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''
export const API = `${BACKEND_URL}/api`

export const AuthContext = createContext(null)
export function useAuth() { return useContext(AuthContext) }

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('ff_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  // Poll for new deployments every 5 minutes; reload if index.html has changed
  useEffect(() => {
    const getScriptHash = (html) => {
      const match = html.match(/src="\/assets\/index-[^"]+\.js"/)
      return match ? match[0] : null
    }
    let currentHash = null
    const check = async () => {
      try {
        const res = await fetch('/', { cache: 'no-store' })
        const html = await res.text()
        const hash = getScriptHash(html)
        if (currentHash === null) { currentHash = hash; return }
        if (hash && hash !== currentHash) window.location.reload(true)
      } catch {}
    }
    const interval = setInterval(check, 5 * 60 * 1000) // every 5 minutes
    check()
    return () => clearInterval(interval)
  }, [])

  const login = (u) => { setUser(u); localStorage.setItem('ff_user', JSON.stringify(u)) }
  const logout = () => { setUser(null); localStorage.removeItem('ff_user') }
  const updateUser = (u) => { setUser(u); localStorage.setItem('ff_user', JSON.stringify(u)) }

  if (loading) return null

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      <Toaster theme="light" position="bottom-center" richColors />
      <BrowserRouter>
        <Routes>
          {/* Login page still exists for direct nav, but redirects home if already logged in */}
          <Route path="/login" element={user ? <Navigate to="/home" /> : <LoginPage />} />
          {/* Root always goes home — no auth wall */}
          <Route path="/" element={<Navigate to="/home" />} />
          {/* All app routes are open — Layout handles guest state */}
          <Route element={<Layout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/teams" element={<MyTeamsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/legacy" element={<HistoryPage />} />
            <Route path="/history" element={<Navigate to="/legacy" />} />
            <Route path="/cup-race" element={<CupRacePage />} />
            {user?.is_admin && <Route path="/admin" element={<AdminPage />} />}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

export default App
