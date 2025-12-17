import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import './Profile.css'

function Profile({ userInfo, onLogout }) {
  const navigate = useNavigate()
  const [stockSymbol, setStockSymbol] = useState('')
  const [stockInfo, setStockInfo] = useState(null)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const handleAskDoubts = () => {
    if (!stockSymbol.trim()) return
    // Mock LLM response for stock analysis
    const mockData = {
      symbol: stockSymbol.toUpperCase(),
      support: Math.random() * 100 + 50,
      resistance: Math.random() * 200 + 150,
      allTimeHigh: Math.random() * 500 + 200,
      allTimeLow: Math.random() * 50 + 10,
      description: `This is a mock analysis for ${stockSymbol.toUpperCase()}. Support level indicates the price at which the stock tends to find buying interest. Resistance is the level where selling pressure typically increases.`
    }
    setStockInfo(mockData)
  }

  // Get join date from localStorage or use current date
  const getJoinDate = () => {
    const joinDate = localStorage.getItem('joinDate')
    if (joinDate) {
      return new Date(joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
    const now = new Date()
    localStorage.setItem('joinDate', now.toISOString())
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const displayUserInfo = userInfo || {
    name: 'User',
    email: 'user@example.com',
  }

  const settings = [
    { id: 1, label: 'Account Settings', icon: '⚙️', action: () => alert('Account Settings') },
    { id: 2, label: 'Security', icon: '🔒', action: () => alert('Security Settings') },
    { id: 3, label: 'Notifications', icon: '🔔', action: () => alert('Notification Settings') },
    { id: 4, label: 'Payment Methods', icon: '💳', action: () => setShowPaymentModal(true) },
    { id: 5, label: 'Help & Support', icon: '❓', action: () => setShowHelpModal(true) },
  ]

  return (
    <div className="profile">
      <div className="profile-header">
        <h1>My Profile</h1>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {displayUserInfo.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="profile-info">
            <h2>{displayUserInfo.name}</h2>
            <p className="profile-email">{displayUserInfo.email}</p>
            <div className="profile-badge verified">
              ✓ Verified
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Personal Information</h3>
          <div className="info-list">
            <div className="info-item">
              <span className="info-label">Full Name</span>
              <span className="info-value">{displayUserInfo.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{displayUserInfo.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Member Since</span>
              <span className="info-value">{getJoinDate()}</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Ask Your Doubts</h3>
          <div className="ask-doubts">
            <input
              type="text"
              placeholder="Enter stock symbol (e.g., AAPL)"
              value={stockSymbol}
              onChange={(e) => setStockSymbol(e.target.value)}
              className="stock-input"
            />
            <button onClick={handleAskDoubts} className="ask-button">Ask</button>
            {stockInfo && (
              <div className="stock-info">
                <h4>Analysis for {stockInfo.symbol}</h4>
                <p><strong>Support Level:</strong> ${stockInfo.support.toFixed(2)}</p>
                <p><strong>Resistance Level:</strong> ${stockInfo.resistance.toFixed(2)}</p>
                <p><strong>All-Time High:</strong> ${stockInfo.allTimeHigh.toFixed(2)}</p>
                <p><strong>All-Time Low:</strong> ${stockInfo.allTimeLow.toFixed(2)}</p>
                <p>{stockInfo.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h3>Settings</h3>
          <div className="settings-list">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="settings-item"
                onClick={setting.action}
              >
                <span className="settings-icon">{setting.icon}</span>
                <span className="settings-label">{setting.label}</span>
                <span className="settings-arrow">›</span>
              </div>
            ))}
          </div>
        </div>

        <div className="profile-actions">
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {showHelpModal && (
        <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Help & Support</h2>
            <div className="help-content">
              <h3>Getting Started</h3>
              <p>Welcome to Crypto Trade Sim! This app allows you to simulate cryptocurrency trading without real money.</p>
              
              <h3>How to Trade</h3>
              <p>1. Navigate to the Crypto List page to view available cryptocurrencies.</p>
              <p>2. Use the Buy/Sell modal to place orders.</p>
              <p>3. Monitor your positions on the Positions page.</p>
              
              <h3>Features</h3>
              <ul>
                <li>Real-time price simulation</li>
                <li>Portfolio tracking</li>
                <li>Trading history</li>
                <li>Profile management</li>
              </ul>
              
              <h3>Support</h3>
              <p>If you need help, contact our support team at support@cryptotradesim.com</p>
            </div>
            <button className="close-modal" onClick={() => setShowHelpModal(false)}>Close</button>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Payment Methods</h2>
            <div className="payment-content">
              <h3>Dummy Payment Methods</h3>
              <p>This is a simulation app. No real payments are processed.</p>
              
              <div className="payment-option">
                <h4>Credit Card</h4>
                <p>**** **** **** 1234</p>
                <p>Expires: 12/25</p>
              </div>
              
              <div className="payment-option">
                <h4>PayPal</h4>
                <p>user@example.com</p>
              </div>
              
              <div className="payment-option">
                <h4>Bank Transfer</h4>
                <p>Account: ****1234</p>
              </div>
            </div>
            <button className="close-modal" onClick={() => setShowPaymentModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
