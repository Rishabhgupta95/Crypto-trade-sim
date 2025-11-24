import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Login.css'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // Simple validation - in real app, this would call an API
    if (email && password) {
      // Store user info (extract name from email for demo)
      const name = email.split('@')[0]
      const userData = {
        email: email,
        name: name.charAt(0).toUpperCase() + name.slice(1),
      }
      onLogin(userData)
    } else {
      alert('Please fill in all fields')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🚀 Crypto Exchange</h1>
          <p>Welcome back! Please login to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
        <div className="login-footer">
          <p>
            Don't have an account? <Link to="/signin">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

