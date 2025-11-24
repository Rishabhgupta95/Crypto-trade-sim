import { useState, useEffect } from 'react'
import { fetchMultipleCrypto, formatNumber } from '../services/cryptoApi'
import { getChips, getPortfolio, getTransactions, formatTimeAgo } from '../services/chipsService'
import './Dashboard.css'

function Dashboard({ userInfo }) {
  const [loading, setLoading] = useState(true)
  const [topHoldings, setTopHoldings] = useState([])
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)
  const [profitPercentage, setProfitPercentage] = useState(0)
  const [chips, setChips] = useState(getChips())
  const [recentTransactions, setRecentTransactions] = useState([])
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setApiError(null)
        const portfolio = getPortfolio()
        setChips(getChips())
        
        if (portfolio.length === 0) {
          setTopHoldings([])
          setPortfolioValue(0)
          setTotalProfit(0)
          setProfitPercentage(0)
          setLoading(false)
          return
        }

        const coinIds = portfolio.map((p) => p.coinId)
        const cryptoData = await fetchMultipleCrypto(coinIds)

        // Calculate holdings with current prices
        const holdings = cryptoData.map((crypto) => {
          const holding = portfolio.find((h) => h.coinId === crypto.id)
          if (!holding) return null
          
          const currentValue = crypto.price * holding.amount
          const entryValue = holding.entryPrice * holding.amount
          const profit = currentValue - entryValue
          const profitPercent = ((crypto.price - holding.entryPrice) / holding.entryPrice) * 100

          return {
            name: crypto.name,
            symbol: crypto.symbol,
            amount: holding.amount,
            value: currentValue,
            change: profitPercent,
            price: crypto.price,
            entryPrice: holding.entryPrice,
            profit: profit,
            image: crypto.image,
          }
        }).filter(Boolean)

        setTopHoldings(holdings)

        // Calculate portfolio totals
        const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
        const totalEntryValue = holdings.reduce((sum, h) => sum + h.entryPrice * h.amount, 0)
        const totalProfitAmount = totalValue - totalEntryValue
        const totalProfitPercent = totalEntryValue > 0 ? (totalProfitAmount / totalEntryValue) * 100 : 0

        setPortfolioValue(totalValue)
        setTotalProfit(totalProfitAmount)
        setProfitPercentage(totalProfitPercent)

        // Load recent transactions
        const transactions = getTransactions()
        const formattedTransactions = transactions.slice(0, 5).map((t) => ({
          ...t,
          time: formatTimeAgo(t.timestamp),
        }))
        setRecentTransactions(formattedTransactions)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        setApiError('Unable to reach live market data right now. Showing last known values.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
    
    // Refresh data every 10 seconds to stay within API limits
    const interval = setInterval(loadDashboardData, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">Loading your portfolio...</p>
        </div>
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">
          Welcome back{userInfo?.name ? `, ${userInfo.name}` : ''}! Here's your portfolio overview
        </p>
      </div>

      <div className="dashboard-content">
        {apiError && (
          <div className="api-warning">
            {apiError}
          </div>
        )}
        <div className="chips-card">
          <div className="chips-header">
            <h2>💰 Available Chips</h2>
          </div>
          <div className="chips-value">{chips.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>

        <div className="portfolio-card">
          <div className="portfolio-header">
            <h2>Portfolio Value</h2>
            <span className={`profit-badge ${profitPercentage >= 0 ? 'positive' : 'negative'}`}>
              {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%
            </span>
          </div>
          <div className="portfolio-value">${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="portfolio-profit">
            Total Profit:{' '}
            <span className={totalProfit >= 0 ? 'positive' : 'negative'}>
              {totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="section">
          <h3>Your Holdings</h3>
          {topHoldings.length === 0 ? (
            <div className="no-holdings">
              <p>You don't have any holdings yet. Start trading to build your portfolio!</p>
            </div>
          ) : (
            <div className="holdings-list">
              {topHoldings.map((holding) => (
                <div key={holding.symbol} className="holding-item">
                  <div className="holding-info">
                    {holding.image && (
                      <img src={holding.image} alt={holding.name} className="holding-image" />
                    )}
                    <div>
                      <div className="holding-name">
                        <strong>{holding.name}</strong>
                        <span className="holding-symbol">{holding.symbol}</span>
                      </div>
                      <div className="holding-amount">{holding.amount} {holding.symbol}</div>
                    </div>
                  </div>
                  <div className="holding-value">
                    <div>${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className={`holding-change ${holding.change >= 0 ? 'positive' : 'negative'}`}>
                      {holding.change >= 0 ? '+' : ''}{holding.change.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section">
          <h3>Recent Transactions</h3>
          {recentTransactions.length === 0 ? (
            <div className="no-transactions">
              <p>No transactions yet. Start trading to see your transaction history!</p>
            </div>
          ) : (
            <div className="transactions-list">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-info">
                    <div className={`transaction-type ${transaction.type}`}>
                      {transaction.type === 'buy' ? 'Buy' : 'Sell'}
                    </div>
                    <div className="transaction-crypto">{transaction.crypto}</div>
                    <div className="transaction-time">{transaction.time}</div>
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-amount">{transaction.amount} {transaction.symbol}</div>
                    <div className="transaction-value">${transaction.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    {transaction.type === 'sell' && transaction.profit !== 0 && (
                      <div className={`transaction-profit ${transaction.profit >= 0 ? 'positive' : 'negative'}`}>
                        {transaction.profit >= 0 ? '+' : ''}${transaction.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
