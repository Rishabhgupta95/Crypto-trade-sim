import { useState, useEffect } from 'react'
import { fetchMultipleCrypto } from '../services/cryptoApi'
import { getPortfolio } from '../services/chipsService'
import './Position.css'

function Position() {
  const [loading, setLoading] = useState(true)
  const [positions, setPositions] = useState([])
  const [totalPnl, setTotalPnl] = useState(0)
  const [totalPnlPercentage, setTotalPnlPercentage] = useState(0)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    const loadPositions = async () => {
      try {
        setLoading(true)
        setApiError(null)
        const portfolio = getPortfolio()
        
        if (portfolio.length === 0) {
          setPositions([])
          setTotalPnl(0)
          setTotalPnlPercentage(0)
          setLoading(false)
          return
        }

        const coinIds = portfolio.map((p) => p.coinId)
        const cryptoData = await fetchMultipleCrypto(coinIds)

        const updatedPositions = cryptoData.map((crypto) => {
          const holding = portfolio.find((p) => p.coinId === crypto.id)
          if (!holding) return null
          
          const currentPrice = crypto.price
          const entryPrice = holding.entryPrice
          const amount = holding.amount

          // All positions are Long (buy and hold)
          const pnl = (currentPrice - entryPrice) * amount
          const pnlPercentage = ((currentPrice - entryPrice) / entryPrice) * 100

          return {
            id: holding.coinId,
            crypto: crypto.name,
            symbol: holding.symbol,
            type: 'Long',
            amount: amount,
            entryPrice: entryPrice,
            currentPrice: currentPrice,
            pnl: pnl,
            pnlPercentage: pnlPercentage,
            image: crypto.image,
          }
        }).filter(Boolean)

        setPositions(updatedPositions)

        // Calculate total P&L
        const totalPnlAmount = updatedPositions.reduce((sum, pos) => sum + pos.pnl, 0)
        const totalEntryValue = updatedPositions.reduce(
          (sum, pos) => sum + pos.entryPrice * pos.amount,
          0
        )
        const totalPnlPercent = totalEntryValue > 0 ? (totalPnlAmount / totalEntryValue) * 100 : 0

        setTotalPnl(totalPnlAmount)
        setTotalPnlPercentage(totalPnlPercent)
      } catch (error) {
        console.error('Error loading positions:', error)
        setApiError('Unable to refresh live prices right now. Showing cached values.')
      } finally {
        setLoading(false)
      }
    }

    loadPositions()
    
    // Refresh data every 10 seconds to stay within API limits
    const interval = setInterval(loadPositions, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="position">
        <div className="position-header">
          <h1>Positions</h1>
          <p className="position-subtitle">Loading your positions...</p>
        </div>
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  return (
    <div className="position">
      <div className="position-header">
        <h1>Positions</h1>
        <p className="position-subtitle">Your active trading positions</p>
      </div>

      {apiError && (
        <div className="position-warning">{apiError}</div>
      )}

      <div className="position-summary">
        <div className="summary-card">
          <div className="summary-label">Total P&L</div>
          <div className={`summary-value ${totalPnl >= 0 ? 'positive' : 'negative'}`}>
            ${totalPnl >= 0 ? '+' : ''}{totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`summary-percentage ${totalPnl >= 0 ? 'positive' : 'negative'}`}>
            {totalPnlPercentage >= 0 ? '+' : ''}{totalPnlPercentage.toFixed(2)}%
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Active Positions</div>
          <div className="summary-value">{positions.length}</div>
        </div>
      </div>

      <div className="positions-list">
        {positions.length === 0 ? (
          <div className="no-positions">No active positions. Start trading to see your positions here!</div>
        ) : (
          positions.map((position) => (
            <div key={position.id} className="position-card">
              <div className="position-card-header">
                <div className="position-crypto">
                  {position.image && (
                    <img src={position.image} alt={position.crypto} className="position-image" />
                  )}
                  <div>
                    <strong>{position.crypto}</strong>
                    <span className="position-symbol">{position.symbol}</span>
                  </div>
                </div>
                <div className={`position-type ${position.type.toLowerCase()}`}>
                  {position.type}
                </div>
              </div>
              <div className="position-details">
                <div className="position-row">
                  <span className="position-label">Amount:</span>
                  <span className="position-value">{position.amount} {position.symbol}</span>
                </div>
                <div className="position-row">
                  <span className="position-label">Entry Price:</span>
                  <span className="position-value">${position.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="position-row">
                  <span className="position-label">Current Price:</span>
                  <span className="position-value">${position.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="position-row pnl-row">
                  <span className="position-label">P&L:</span>
                  <span className={`position-value pnl ${position.pnl >= 0 ? 'positive' : 'negative'}`}>
                    ${position.pnl >= 0 ? '+' : ''}{position.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                    ({position.pnl >= 0 ? '+' : ''}{position.pnlPercentage.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Position
