// Chips (Virtual Currency) Management Service
const CHIPS_KEY = 'userChips'
const PORTFOLIO_KEY = 'userPortfolio'
const TRANSACTIONS_KEY = 'userTransactions'
const INITIAL_CHIPS = 100000 // Starting chips: $100,000

// Initialize chips if not exists
export const initializeChips = () => {
  if (!localStorage.getItem(CHIPS_KEY)) {
    localStorage.setItem(CHIPS_KEY, INITIAL_CHIPS.toString())
    return INITIAL_CHIPS
  }
  return parseFloat(localStorage.getItem(CHIPS_KEY))
}

// Get current chips balance
export const getChips = () => {
  const chips = localStorage.getItem(CHIPS_KEY)
  return chips ? parseFloat(chips) : initializeChips()
}

// Update chips balance
export const updateChips = (amount) => {
  const newBalance = getChips() + amount
  localStorage.setItem(CHIPS_KEY, newBalance.toString())
  return newBalance
}

// Check if user has enough chips
export const hasEnoughChips = (amount) => {
  return getChips() >= amount
}

// Portfolio Management
export const getPortfolio = () => {
  const portfolio = localStorage.getItem(PORTFOLIO_KEY)
  return portfolio ? JSON.parse(portfolio) : []
}

export const addToPortfolio = (crypto, amount, price) => {
  const portfolio = getPortfolio()
  const existing = portfolio.find((p) => p.coinId === crypto.id)
  
  if (existing) {
    // Update existing holding
    const totalCost = existing.entryPrice * existing.amount + price * amount
    const totalAmount = existing.amount + amount
    existing.amount = totalAmount
    existing.entryPrice = totalCost / totalAmount // Average entry price
  } else {
    // Add new holding
    portfolio.push({
      coinId: crypto.id,
      name: crypto.name,
      symbol: crypto.symbol,
      amount: amount,
      entryPrice: price,
      image: crypto.image,
    })
  }
  
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio))
  return portfolio
}

export const removeFromPortfolio = (coinId, amount) => {
  const portfolio = getPortfolio()
  const holding = portfolio.find((p) => p.coinId === coinId)
  
  if (!holding) return portfolio
  
  if (holding.amount <= amount) {
    // Remove completely
    const newPortfolio = portfolio.filter((p) => p.coinId !== coinId)
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(newPortfolio))
    return newPortfolio
  } else {
    // Reduce amount (FIFO - first in first out)
    holding.amount -= amount
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio))
    return portfolio
  }
}

export const getHolding = (coinId) => {
  const portfolio = getPortfolio()
  return portfolio.find((p) => p.coinId === coinId)
}

// Transaction History
export const addTransaction = (type, crypto, amount, price, totalValue, profit = 0) => {
  const transactions = getTransactions()
  const newTransaction = {
    id: Date.now(),
    type, // 'buy' or 'sell'
    crypto: crypto.name,
    symbol: crypto.symbol,
    amount,
    price,
    totalValue,
    profit,
    timestamp: new Date().toISOString(),
    time: 'Just now',
  }
  
  transactions.unshift(newTransaction)
  // Keep only last 50 transactions
  if (transactions.length > 50) {
    transactions.pop()
  }
  
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
  return transactions
}

export const getTransactions = () => {
  const transactions = localStorage.getItem(TRANSACTIONS_KEY)
  return transactions ? JSON.parse(transactions) : []
}

// Format time ago
export const formatTimeAgo = (timestamp) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffMs = now - time
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

