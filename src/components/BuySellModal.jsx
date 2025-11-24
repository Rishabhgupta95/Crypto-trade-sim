import { useState, useEffect } from 'react'
import { getChips, hasEnoughChips, updateChips, addToPortfolio, removeFromPortfolio, getHolding, addTransaction } from '../services/chipsService'
import './BuySellModal.css'

function BuySellModal({ crypto, isOpen, onClose, onTransaction }) {
  const [mode, setMode] = useState('buy') // 'buy' or 'sell'
  const [amount, setAmount] = useState('')
  const [chips, setChips] = useState(getChips())
  const [holding, setHolding] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && crypto) {
      setChips(getChips())
      const userHolding = getHolding(crypto.id)
      setHolding(userHolding)
      setAmount('')
      setError('')
    }
  }, [isOpen, crypto])

  if (!isOpen || !crypto) return null

  const handleAmountChange = (e) => {
    const value = e.target.value
    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
      setAmount(value)
      setError('')
    }
  }

  const calculateTotal = () => {
    const amt = parseFloat(amount) || 0
    return amt * crypto.price
  }

  const handleBuy = () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      setError('Please enter a valid amount')
      return
    }

    const totalCost = calculateTotal()
    if (!hasEnoughChips(totalCost)) {
      setError(`Insufficient chips. You need ${totalCost.toFixed(2)} chips but only have ${chips.toFixed(2)}`)
      return
    }

    // Deduct chips
    const newBalance = updateChips(-totalCost)
    
    // Add to portfolio
    addToPortfolio(crypto, amt, crypto.price)
    
    // Add transaction
    addTransaction('buy', crypto, amt, crypto.price, totalCost)
    
    setChips(newBalance)
    setAmount('')
    setError('')
    onTransaction && onTransaction()
    alert(`Successfully bought ${amt} ${crypto.symbol} for ${totalCost.toFixed(2)} chips!`)
  }

  const handleSell = () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!holding || holding.amount < amt) {
      setError(`Insufficient holdings. You only have ${holding?.amount || 0} ${crypto.symbol}`)
      return
    }

    const totalValue = amt * crypto.price
    const entryValue = holding.entryPrice * amt
    const profit = totalValue - entryValue

    // Add chips (profit/loss included)
    const newBalance = updateChips(totalValue)
    
    // Remove from portfolio
    removeFromPortfolio(crypto.id, amt)
    
    // Add transaction
    addTransaction('sell', crypto, amt, crypto.price, totalValue, profit)
    
    setChips(newBalance)
    setAmount('')
    setError('')
    onTransaction && onTransaction()
    
    const profitText = profit >= 0 
      ? `Profit: +${profit.toFixed(2)} chips` 
      : `Loss: ${profit.toFixed(2)} chips`
    alert(`Successfully sold ${amt} ${crypto.symbol} for ${totalValue.toFixed(2)} chips! ${profitText}`)
  }

  const handleMax = () => {
    if (mode === 'buy') {
      const maxAmount = Math.floor(chips / crypto.price * 100) / 100 // Round down to 2 decimals
      setAmount(maxAmount.toString())
    } else {
      if (holding) {
        setAmount(holding.amount.toString())
      }
    }
  }

  const openTradingView = () => {
    // TradingView symbol format: BINANCE:BTCUSDT for Bitcoin
    // Try Binance first, fallback to Coinbase for some coins
    const symbol = `BINANCE:${crypto.symbol}USDT`
    const url = `https://www.tradingview.com/chart/?symbol=${symbol}`
    window.open(url, '_blank')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{crypto.name} ({crypto.symbol})</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-price">
          <div className="current-price">${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</div>
          <div className={`price-change ${crypto.change >= 0 ? 'positive' : 'negative'}`}>
            {crypto.change >= 0 ? '+' : ''}{crypto.change.toFixed(2)}%
          </div>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-button ${mode === 'buy' ? 'active' : ''}`}
            onClick={() => setMode('buy')}
          >
            Buy
          </button>
          <button 
            className={`tab-button ${mode === 'sell' ? 'active' : ''}`}
            onClick={() => setMode('sell')}
            disabled={!holding || holding.amount === 0}
          >
            Sell {holding ? `(${holding.amount} ${crypto.symbol})` : ''}
          </button>
        </div>

        <div className="modal-body">
          <div className="chips-display">
            <span>Available Chips:</span>
            <strong>{chips.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>

          {mode === 'sell' && holding && (
            <div className="holding-info">
              <span>Your Holdings:</span>
              <strong>{holding.amount} {crypto.symbol} @ ${holding.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} avg</strong>
            </div>
          )}

          <div className="input-group">
            <label>Amount ({crypto.symbol})</label>
            <div className="input-with-button">
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              <button className="max-button" onClick={handleMax}>MAX</button>
            </div>
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="calculation">
              <div className="calc-row">
                <span>Price per {crypto.symbol}:</span>
                <span>${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</span>
              </div>
              <div className="calc-row">
                <span>Total {mode === 'buy' ? 'Cost' : 'Value'}:</span>
                <strong>${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
              {mode === 'sell' && holding && parseFloat(amount) > 0 && (
                <div className="calc-row profit-row">
                  <span>Estimated {calculateTotal() - (holding.entryPrice * parseFloat(amount)) >= 0 ? 'Profit' : 'Loss'}:</span>
                  <strong className={calculateTotal() - (holding.entryPrice * parseFloat(amount)) >= 0 ? 'positive' : 'negative'}>
                    ${(calculateTotal() - (holding.entryPrice * parseFloat(amount))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
              )}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button 
              className={`action-button ${mode}`}
              onClick={mode === 'buy' ? handleBuy : handleSell}
            >
              {mode === 'buy' ? 'Buy' : 'Sell'} {crypto.symbol}
            </button>
            <button 
              className="action-button chart-button"
              onClick={openTradingView}
            >
              📈 View Chart on TradingView
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuySellModal

