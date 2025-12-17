import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import CryptoList from './pages/CryptoList'
import Position from './pages/Position'
import Profile from './pages/Profile'
import BottomNav from './components/BottomNav'
import { ModalProvider } from './contexts/ModalContext'
import { UserProvider } from './contexts/UserContext'
import { initializeChips } from './services/chipsService'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userInfo, setUserInfo] = useState(null)

  useEffect(() => {
    // Initialize chips system
    initializeChips()

    // Check if user is logged in (from localStorage)
    const auth = localStorage.getItem('isAuthenticated')
    const user = localStorage.getItem('userInfo')
    if (auth === 'true' && user) {
      setIsAuthenticated(true)
      setUserInfo(JSON.parse(user))
    } localStorage
  }, [])

  const handleLogin = (userData) => {
    setIsAuthenticated(true)
    setUserInfo(userData)
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('userInfo', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserInfo(null)
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userInfo')
  }

  return (
    <UserProvider>
      <ModalProvider>
        <div className="app">
          <Routes>
            <Route
              path="/login"
              element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/signin"
              element={!isAuthenticated ? <SignIn onLogin={handleLogin} /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/dashboard"
              element={isAuthenticated ? <Dashboard userInfo={userInfo} /> : <Navigate to="/login" />}
            />
            <Route
              path="/crypto"
              element={isAuthenticated ? <CryptoList /> : <Navigate to="/login" />}
            />
            <Route
              path="/position"
              element={isAuthenticated ? <Position /> : <Navigate to="/login" />}
            />
            <Route
              path="/profile"
              element={isAuthenticated ? <Profile userInfo={userInfo} onLogout={handleLogout} /> : <Navigate to="/login" />}
            />
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
          </Routes>
          {isAuthenticated && <BottomNav />}
        </div>
      </ModalProvider>
    </UserProvider>
  )
}

export default App
