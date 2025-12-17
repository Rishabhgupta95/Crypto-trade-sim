import { fetchNews, fetchCryptoDetails, fetchCryptoList, formatNumber } from '../services/cryptoApi' // Removed unused imports
import { formatTimeAgo } from '../services/chipsService'
import { useModal } from '../contexts/ModalContext'
import { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'
import { usePortfolioValues } from '../hooks/usePortfolioValues'
import './Dashboard.css'

function Dashboard({ userInfo }) {
  const { openModal } = useModal()
  const [news, setNews] = useState([])
  const [marketWatch, setMarketWatch] = useState({ high: [], low: [] })

  // Use Global State & Hook
  const { chips, portfolio, transactions } = useUser()
  const {
    holdings: topHoldings,
    totalValue: portfolioValue,
    totalProfit,
    totalProfitPercent: profitPercentage,
    loading,
    error: apiError
  } = usePortfolioValues(portfolio)

  const recentTransactions = transactions.slice(0, 5).map((t) => ({
    ...t,
    time: formatTimeAgo(t.timestamp),
  }))

  useEffect(() => {
    const loadExtraData = async () => {
      try {
        // Load news
        const newsData = await fetchNews()
        setNews(newsData.slice(0, 5))

        // Load Market Watch Data (Top 50)
        const marketData = await fetchCryptoList(1, 50)
        const highs = []
        const lows = []

        marketData.forEach(coin => {
          if (coin.high24h && coin.low24h && coin.high24h !== coin.low24h) {
            const range = coin.high24h - coin.low24h
            const position = (coin.price - coin.low24h) / range

            if (position > 0.9) highs.push(coin)
            if (position < 0.1) lows.push(coin)
          }
        })

        setMarketWatch({
          high: highs.slice(0, 5),
          low: lows.slice(0, 5)
        })

      } catch (error) {
        console.error('Error loading extra dashboard data:', error)
      }
    }

    loadExtraData()
    // Refresh news/market watch every 2 minutes separate from portfolio
    const interval = setInterval(loadExtraData, 20000)
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
                        <strong
                          className="clickable-crypto"
                          onClick={() => openModal({
                            // Added: Pass correct ID for modal
                            id: holding.id || holding.symbol.toLowerCase(),
                            name: holding.name,
                            symbol: holding.symbol,
                            price: holding.price,
                            change: holding.change24h, // Fix: Use market 24h change, not portfolio P/L
                            image: holding.image
                          })}
                        >
                          {holding.name}
                        </strong>
                        <span
                          className="holding-symbol clickable-crypto"
                          onClick={() => openModal({
                            // Added: Pass correct ID for modal
                            id: holding.id || holding.symbol.toLowerCase(),
                            name: holding.name,
                            symbol: holding.symbol,
                            price: holding.price,
                            change: holding.change24h, // Fix: Use market 24h change, not portfolio P/L
                            image: holding.image
                          })}
                        >
                          {holding.symbol}
                        </span>
                      </div>
                      <div className="holding-amount">{holding.amount} {holding.symbol}</div>
                    </div>
                  </div>
                  <div className="holding-value">
                    <div>${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className={`holding-change ${holding.change >= 0 ? 'positive' : 'negative'}`}>
                      {holding.change >= 0 ? '+' : ''}{holding.change.toFixed(2)}%
                    </div>
                    <div className="holding-24h">
                      24h: H:${holding.high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L:${holding.low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    {transaction.coinId ? (
                      <div
                        className="transaction-crypto clickable-crypto"
                        onClick={async () => {
                          try {
                            const details = await fetchCryptoDetails(transaction.coinId)
                            openModal({
                              id: details.id,
                              name: details.name,
                              symbol: details.symbol,
                              price: details.price,
                              change: details.change, // key for BuySellModal visual
                              image: details.image
                            })
                          } catch (e) {
                            console.error('Failed to load crypto details', e)
                          }
                        }}
                      >
                        <strong>{transaction.crypto}</strong>
                      </div>
                    ) : (
                      <div className="transaction-crypto">{transaction.crypto}</div>
                    )}
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

        <div className="section">
          <h3>24h Market Watch</h3>
          <div className="market-watch-container">
            <div className="market-watch-card">
              <div className="market-watch-header">
                <h4>🚀 Near 24h High</h4>
                <span className="market-watch-subtitle">Trading near daily peak</span>
              </div>
              {marketWatch.high.length === 0 ? (
                <p className="no-data-text">No coins near 24h high right now</p>
              ) : (
                <div className="market-watch-list">
                  {marketWatch.high.map(coin => (
                    <div
                      key={coin.id}
                      className="market-watch-item clickable-crypto"
                      onClick={() => openModal(coin)}
                    >
                      <div className="mw-coin-info">
                        <img src={coin.image} alt={coin.name} />
                        <span className="mw-symbol">{coin.symbol}</span>
                      </div>
                      <div className="mw-price-info">
                        <span className="mw-price">${formatNumber(coin.price)}</span>
                        <span className="mw-change positive">+{coin.change.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="market-watch-card">
              <div className="market-watch-header">
                <h4>📉 Near 24h Low</h4>
                <span className="market-watch-subtitle">Trading near daily bottom</span>
              </div>
              {marketWatch.low.length === 0 ? (
                <p className="no-data-text">No coins near 24h low right now</p>
              ) : (
                <div className="market-watch-list">
                  {marketWatch.low.map(coin => (
                    <div
                      key={coin.id}
                      className="market-watch-item clickable-crypto"
                      onClick={() => openModal(coin)}
                    >
                      <div className="mw-coin-info">
                        <img src={coin.image} alt={coin.name} />
                        <span className="mw-symbol">{coin.symbol}</span>
                      </div>
                      <div className="mw-price-info">
                        <span className="mw-price">${formatNumber(coin.price)}</span>
                        <span className="mw-change negative">{coin.change.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="section">
          <h3>Crypto News</h3>
          {news.length === 0 ? (
            <div className="no-news">
              <p>No news available at the moment.</p>
            </div>
          ) : (
            <div className="news-list">
              {news.map((article) => (
                <div key={article.id} className="news-item">
                  <div className="news-content">
                    <div className="news-title">
                      <a href={article.url} target="_blank" rel="noopener noreferrer">
                        {article.title}
                      </a>
                    </div>
                    <div className="news-source">
                      {article.source} • {new Date(article.published_on * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  {article.imageurl && (
                    <img src={article.imageurl} alt={article.title} className="news-image" />
                  )}
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
