import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { fetchCryptoList, fetchLivePrices, formatNumber } from '../services/cryptoApi'
import BuySellModal from '../components/BuySellModal'
import './CryptoList.css'

const PriceCell = memo(function PriceCell({ price }) {
  return (
    <div className="crypto-col-price">
      ${price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      })}
    </div>
  )
})

const ChangeCell = memo(function ChangeCell({ change }) {
  return (
    <div className={`crypto-col-change ${change >= 0 ? 'positive' : 'negative'}`}>
      {change >= 0 ? '+' : ''}
      {change.toFixed(2)}%
    </div>
  )
})

const MarketCapCell = memo(function MarketCapCell({ marketCap }) {
  return <div className="crypto-col-marketcap">{formatNumber(marketCap)}</div>
})

const CryptoRow = memo(
  ({ crypto, priceData, onRowClick, onChartClick }) => {
    const price = priceData?.price ?? crypto.price
    const change = priceData?.change ?? crypto.change
    const marketCap = priceData?.marketCap ?? crypto.marketCap

    return (
      <div className="crypto-row" onClick={() => onRowClick(crypto.id)}>
        <div className="crypto-col-name">
          <div className="crypto-name-main">
            {crypto.image && (
              <img src={crypto.image} alt={crypto.name} className="crypto-image" />
            )}
            <div className="crypto-name-text">
              <strong>{crypto.name}</strong>
              <span className="crypto-symbol">{crypto.symbol}</span>
            </div>
          </div>
        </div>
        <PriceCell price={price} />
        <ChangeCell change={change} />
        <MarketCapCell marketCap={marketCap} />
        <div className="crypto-col-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="chart-button-small"
            onClick={(e) => onChartClick(crypto, e)}
            title="View Chart on TradingView"
          >
            📈
          </button>
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    const prevData = prevProps.priceData
    const nextData = nextProps.priceData

    return (
      prevProps.crypto === nextProps.crypto &&
      prevData?.price === nextData?.price &&
      prevData?.change === nextData?.change &&
      prevData?.marketCap === nextData?.marketCap
    )
  }
)

function CryptoList() {
  const cryptoIdsRef = useRef([])
  const [searchTerm, setSearchTerm] = useState('')
  const [cryptocurrencies, setCryptocurrencies] = useState([])
  const [priceMap, setPriceMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCryptoId, setSelectedCryptoId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchCryptoList(1, 100)
        if (!isMounted) return

        setCryptocurrencies(data)
        cryptoIdsRef.current = data.map((coin) => coin.id)
        setPriceMap(
          data.reduce((acc, coin) => {
            acc[coin.id] = {
              price: coin.price,
              change: coin.change,
              marketCap: coin.marketCap,
            }
            return acc
          }, {})
        )
      } catch (err) {
        if (!isMounted) return
        setError('Failed to load cryptocurrency data. Please try again later.')
        console.error('Error fetching crypto list:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const updatePrices = async () => {
      try {
        const ids = cryptoIdsRef.current
        if (!ids.length) return

        const prices = await fetchLivePrices(ids)
        if (!isMounted) return

        setPriceMap((prev) => {
          const updated = { ...prev }
          let changed = false

          Object.entries(prices).forEach(([id, values]) => {
            const existing = prev[id]
            if (
              !existing ||
              existing.price !== values.price ||
              existing.change !== values.change ||
              existing.marketCap !== values.marketCap
            ) {
              updated[id] = {
                price: values.price,
                change: values.change,
                marketCap: values.marketCap,
              }
              changed = true
            }
          })

          return changed ? updated : prev
        })
      } catch (err) {
        if (!isMounted) return
        console.error('Error updating crypto prices:', err)
      }
    }

    loadInitialData()
    const interval = setInterval(updatePrices, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const handleCryptoClick = useCallback((cryptoId) => {
    setSelectedCryptoId(cryptoId)
    setIsModalOpen(true)
  }, [])

  const handleChartClick = useCallback((crypto, e) => {
    e.stopPropagation()
    const symbol = `BINANCE:${crypto.symbol}USDT`
    const url = `https://www.tradingview.com/chart/?symbol=${symbol}`
    window.open(url, '_blank')
  }, [])

  const handleTransaction = useCallback(async () => {
    try {
      const ids = cryptoIdsRef.current
      if (!ids.length) return
      const prices = await fetchLivePrices(ids)
      setPriceMap((prev) => ({
        ...prev,
        ...Object.entries(prices).reduce((acc, [id, values]) => {
          acc[id] = {
            price: values.price,
            change: values.change,
            marketCap: values.marketCap,
          }
          return acc
        }, {}),
      }))
    } catch (err) {
      console.error('Error refreshing crypto prices:', err)
    }
  }, [])

  useEffect(() => {
    cryptoIdsRef.current = cryptocurrencies.map((coin) => coin.id)
  }, [cryptocurrencies])

  const filteredCrypto = useMemo(
    () =>
      cryptocurrencies.filter(
        (crypto) =>
          crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [cryptocurrencies, searchTerm]
  )

  const selectedCrypto = useMemo(() => {
    if (!selectedCryptoId) return null
    const base = cryptocurrencies.find((coin) => coin.id === selectedCryptoId)
    if (!base) return null
    const priceData = priceMap[selectedCryptoId]
    return priceData ? { ...base, ...priceData } : base
  }, [cryptocurrencies, priceMap, selectedCryptoId])

  if (loading) {
    return (
      <div className="crypto-list">
        <div className="crypto-header">
          <h1>Cryptocurrencies</h1>
          <p className="crypto-subtitle">Loading cryptocurrency data...</p>
        </div>
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="crypto-list">
        <div className="crypto-header">
          <h1>Cryptocurrencies</h1>
          <p className="crypto-subtitle">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="crypto-list">
      <div className="crypto-header">
        <h1>Cryptocurrencies</h1>
        <p className="crypto-subtitle">
          Click on any currency to buy/sell • Click chart icon to view TradingView
        </p>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search cryptocurrencies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="crypto-table">
        <div className="crypto-table-header">
          <div className="crypto-col-name">Name</div>
          <div className="crypto-col-price">Price</div>
          <div className="crypto-col-change">24h Change</div>
          <div className="crypto-col-marketcap">Market Cap</div>
          <div className="crypto-col-actions">Actions</div>
        </div>
        <div className="crypto-table-body">
          {filteredCrypto.length === 0 ? (
            <div className="no-results">No cryptocurrencies found</div>
          ) : (
            filteredCrypto.map((crypto) => (
              <CryptoRow
                key={crypto.id}
                crypto={crypto}
                priceData={priceMap[crypto.id]}
                onRowClick={handleCryptoClick}
                onChartClick={handleChartClick}
              />
            ))
          )}
        </div>
      </div>

      <BuySellModal
        crypto={selectedCrypto}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransaction={handleTransaction}
      />
    </div>
  )
}

export default CryptoList
