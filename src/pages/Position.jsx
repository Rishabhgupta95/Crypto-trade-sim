import { useUser } from '../contexts/UserContext'
import { usePortfolioValues } from '../hooks/usePortfolioValues'
import { useModal } from '../contexts/ModalContext'
import './Position.css'

function Position() {
  const { openModal } = useModal()
  const { portfolio } = useUser()

  const {
    holdings: positions,
    totalProfit: totalPnl,
    totalProfitPercent: totalPnlPercentage,
    loading,
    error: apiError
  } = usePortfolioValues(portfolio)

  const handleSellClick = (position) => {
    openModal({
      id: position.id,
      name: position.name,
      symbol: position.symbol,
      price: position.price,
      change: position.change24h,
      image: position.image,
    }, 'sell')
  }

  const handleCryptoClick = (position) => {
    openModal({
      id: position.id,
      name: position.name,
      symbol: position.symbol,
      price: position.price,
      change: position.change24h,
      image: position.image,
    }, 'buy')
  }

  if (loading && positions.length === 0) {
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
                    <img src={position.image} alt={position.name} className="position-image" />
                  )}
                  <div>
                    <strong
                      className="clickable-crypto"
                      onClick={() => handleCryptoClick(position)}
                    >
                      {position.name}
                    </strong>
                    <span
                      className="position-symbol clickable-crypto"
                      onClick={() => handleCryptoClick(position)}
                    >
                      {position.symbol}
                    </span>
                  </div>
                </div>
                <div className="position-type long">
                  Long
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
                  <span className="position-value">${position.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="position-row pnl-row">
                  <span className="position-label">P&L:</span>
                  <span className={`position-value pnl ${position.profit >= 0 ? 'positive' : 'negative'}`}>
                    ${position.profit >= 0 ? '+' : ''}{position.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    ({position.profit >= 0 ? '+' : ''}{position.profitPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="position-actions">
                <button className="sell-button" onClick={() => handleSellClick(position)}>
                  Sell
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Position
