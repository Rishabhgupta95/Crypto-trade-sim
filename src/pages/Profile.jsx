import { useNavigate } from 'react-router-dom'
import './Profile.css'

function Profile({ userInfo, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
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
    { id: 4, label: 'Payment Methods', icon: '💳', action: () => alert('Payment Methods') },
    { id: 5, label: 'Help & Support', icon: '❓', action: () => alert('Help & Support') },
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
    </div>
  )
}

export default Profile
