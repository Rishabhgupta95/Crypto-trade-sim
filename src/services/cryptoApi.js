const API_BASE_URL = 'https://api.coingecko.com/api/v3'
const DEFAULT_COINS = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 65000,
    change: 1.5,
    marketCap: 1.2e12,
    volume: 3.2e10,
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 3200,
    change: 2.1,
    marketCap: 3.8e11,
    volume: 1.5e10,
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  },
  {
    id: 'tether',
    name: 'Tether',
    symbol: 'USDT',
    price: 1,
    change: 0.01,
    marketCap: 1.1e11,
    volume: 4e10,
    image: 'https://assets.coingecko.com/coins/images/325/large/Tether-logo.png',
  },
  {
    id: 'binancecoin',
    name: 'BNB',
    symbol: 'BNB',
    price: 550,
    change: -0.5,
    marketCap: 8.5e10,
    volume: 2.2e9,
    image: 'https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png',
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    price: 145,
    change: 3.4,
    marketCap: 6.8e10,
    volume: 3.8e9,
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  },
]

const CG_API_KEY = import.meta.env.VITE_COINGECKO_API_KEY
const MARKET_CACHE_TTL = 60 * 1000 // 1 minute
const PRICE_CACHE_TTL = 30 * 1000 // 30 seconds
const REQUEST_TIMEOUT = 10000

let cachedMarketData = []
let lastMarketFetch = 0
let cachedPrices = {}
let lastPriceFetch = 0
let rateLimitCooldownUntil = 0

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const chunkArray = (arr, size) => {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

const applyJitter = (value) => {
  const maxDelta = value * 0.001 // 0.1%
  const delta = (Math.random() * 2 - 1) * maxDelta
  return Math.max(0, value + delta)
}

const withHeaders = (custom = {}) => ({
  accept: 'application/json',
  ...(CG_API_KEY ? { 'x-cg-demo-api-key': CG_API_KEY } : {}),
  ...custom,
})

const handleRateLimit = () => {
  rateLimitCooldownUntil = Date.now() + 60 * 1000
}

const isRateLimited = () => Date.now() < rateLimitCooldownUntil

const safeFetch = async (endpoint, { method = 'GET', signal } = {}) => {
  if (isRateLimited()) {
    throw new Error('RATE_LIMITED')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: withHeaders(),
      signal: signal || controller.signal,
    })

    if (response.status === 429) {
      handleRateLimit()
      throw new Error('RATE_LIMITED')
    }

    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`)
    }

    return await response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

const mapCoin = (coin) => ({
  id: coin.id,
  name: coin.name,
  symbol: coin.symbol.toUpperCase(),
  price: coin.current_price ?? coin.price ?? 0,
  change: coin.price_change_percentage_24h ?? coin.change ?? 0,
  marketCap: coin.market_cap ?? coin.marketCap ?? 0,
  volume: coin.total_volume ?? coin.volume ?? 0,
  image: coin.image,
  high24h: coin.high_24h ?? 0,
  low24h: coin.low_24h ?? 0,
})

const ensureCachedMarketData = (data) => {
  cachedMarketData = data
  lastMarketFetch = Date.now()
  cachedPrices = data.reduce((acc, coin) => {
    acc[coin.id] = {
      price: coin.price,
      change: coin.change,
      marketCap: coin.marketCap,
    }
    return acc
  }, {})
  lastPriceFetch = Date.now()
}

export const fetchCryptoList = async (page = 1, perPage = 100) => {
  const now = Date.now()
  if (cachedMarketData.length && now - lastMarketFetch < MARKET_CACHE_TTL) {
    return cachedMarketData
  }

  try {
    const data = await safeFetch(
      `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h`
    )

    const mapped = data.map(mapCoin)

    ensureCachedMarketData(mapped)

    return mapped
  } catch (error) {
    console.warn('[cryptoApi] Falling back to cached market data', error)
    const fallback = cachedMarketData.length ? cachedMarketData : seededMarketData
    ensureCachedMarketData(fallback)
    return fallback
  }
}

export const fetchCryptoDetails = async (coinId) => {
  try {
    const data = await safeFetch(
      `/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
    )

    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      price: data.market_data?.current_price?.usd ?? 0,
      change: data.market_data?.price_change_percentage_24h ?? 0,
      marketCap: data.market_data?.market_cap?.usd ?? 0,
      volume: data.market_data?.total_volume?.usd ?? 0,
      image: data.image?.small,
    }
  } catch (error) {
    console.warn('[cryptoApi] Falling back to cached details', error)
    const fallback = cachedMarketData.find((coin) => coin.id === coinId)
    if (fallback) {
      return fallback
    }
    const defaultCoin = DEFAULT_COINS.find((coin) => coin.id === coinId)
    if (defaultCoin) {
      return defaultCoin
    }
    throw error
  }
}

export const fetchMultipleCrypto = async (coinIds = []) => {
  if (!Array.isArray(coinIds) || coinIds.length === 0) {
    return []
  }

  const uniqueIds = [...new Set(coinIds)]
  const now = Date.now()

  if (cachedMarketData.length && now - lastMarketFetch < MARKET_CACHE_TTL) {
    return cachedMarketData.filter((coin) => uniqueIds.includes(coin.id))
  }

  try {
    const chunks = chunkArray(uniqueIds, 50)
    const fetchedCoins = new Map()

    for (const chunk of chunks) {
      const ids = chunk.join(',')
      const data = await safeFetch(
        `/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h&include_24hr_change=true`
      )

      data.map(mapCoin).forEach((coin) => {
        fetchedCoins.set(coin.id, coin)
      })

      if (chunks.length > 1) {
        await sleep(250)
      }
    }

    const merged = new Map(cachedMarketData.map((coin) => [coin.id, coin]))
    fetchedCoins.forEach((coin) => {
      merged.set(coin.id, coin)
    })

    // Fill any missing ids with cached/default data
    uniqueIds.forEach((id) => {
      if (!merged.has(id)) {
        const cached = cachedMarketData.find((coin) => coin.id === id)
        const fallback = cached ?? seededMarketData.find((coin) => coin.id === id)
        if (fallback) {
          merged.set(id, fallback)
        }
      }
    })

    ensureCachedMarketData(Array.from(merged.values()))

    return uniqueIds
      .map((id) => merged.get(id))
      .filter(Boolean)
  } catch (error) {
    console.warn('[cryptoApi] Falling back to cached multiple crypto', error)
    const merged = new Map(cachedMarketData.map((coin) => [coin.id, coin]))

    uniqueIds.forEach((id) => {
      if (!merged.has(id)) {
        const fallback = seededMarketData.find((coin) => coin.id === id)
        if (fallback) {
          merged.set(id, fallback)
        }
      }
    })

    if (!merged.size) {
      seededMarketData.forEach((coin) => merged.set(coin.id, coin))
    }

    ensureCachedMarketData(Array.from(merged.values()))

    return uniqueIds
      .map((id) => merged.get(id))
      .filter(Boolean)
  }
}

export const fetchLivePrices = async (coinIds = []) => {
  if (!Array.isArray(coinIds) || coinIds.length === 0) {
    return {}
  }

  const now = Date.now()
  if (now - lastPriceFetch < PRICE_CACHE_TTL) {
    return coinIds.reduce((acc, id) => {
      if (cachedPrices[id]) {
        acc[id] = cachedPrices[id]
      }
      return acc
    }, {})
  }

  try {
    const chunks = chunkArray(coinIds, 100)
    const results = {}

    for (const chunk of chunks) {
      let data
      try {
        data = await safeFetch(
          `/simple/price?ids=${chunk.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&precision=8`
        )
      } catch (error) {
        if (error.message === 'RATE_LIMITED') {
          handleRateLimit()
          throw error
        }
        throw error
      }

      Object.entries(data).forEach(([id, values]) => {
        results[id] = {
          price: values.usd,
          change: values.usd_24h_change ?? 0,
          marketCap: values.usd_market_cap ?? cachedPrices[id]?.marketCap ?? 0,
        }
      })

      // small delay to avoid hitting rate limit
      await sleep(5000)
    }

    cachedPrices = {
      ...cachedPrices,
      ...results,
    }
    lastPriceFetch = Date.now()

    return results
  } catch (error) {
    console.warn('[cryptoApi] Falling back to simulated live prices', error)

    const fallback = {}
    coinIds.forEach((id) => {
      const cached = cachedPrices[id]
      if (cached) {
        const simulatedPrice = applyJitter(cached.price)
        const simulatedChange = applyJitter(cached.change)
        fallback[id] = {
          price: simulatedPrice,
          change: simulatedChange,
          marketCap: cached.marketCap,
        }
        cachedPrices[id] = fallback[id]
      }
    })

    lastPriceFetch = Date.now()

    return fallback
  }
}

export const formatNumber = (num) => {
  if (typeof num !== 'number' || Number.isNaN(num)) {
    return '0'
  }
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T'
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

export const fetchNews = async () => {
  try {
    // Using CryptoCompare news API (free tier)
    const response = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&limit=10')
    const data = await response.json()
    
    if (data.Data) {
      return data.Data.map((article) => ({
        id: article.id,
        title: article.title,
        url: article.url,
        source: article.source,
        published_on: article.published_on,
        imageurl: article.imageurl,
      }))
    }
    return []
  } catch (error) {
    console.error('Error fetching news:', error)
    return []
  }
}

