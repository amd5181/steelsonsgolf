import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import MyTeamsPage from './pages/MyTeamsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import RulesPage from './pages/RulesPage'
import HistoryPage from './pages/HistoryPage'
import AdminPage from './pages/AdminPage'
import Layout from './components/Layout'
import './App.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''
export const API = `${BACKEND_URL}/api`

export const AuthContext = createContext(null)
export function useAuth() { return useContext(AuthContext) }

const INACTIVITY_MS = 2 * 60 * 60 * 1000 // 2 hours

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

  useEffect(() => {
    let timer
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(() => window.location.reload(true), INACTIVITY_MS)
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      clearTimeout(timer)
      events.forEach(e => window.removeEventListener(e, reset))
    }
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
            {user?.is_admin && <Route path="/admin" element={<AdminPage />} />}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

export default App
