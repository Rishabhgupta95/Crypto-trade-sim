import { useState, useEffect } from 'react'
import { fetchMultipleCrypto } from '../services/cryptoApi'

export const usePortfolioValues = (portfolio) => {
  const [holdings, setHoldings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Totals
  const [totalValue, setTotalValue] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)
  const [totalProfitPercent, setTotalProfitPercent] = useState(0)

  useEffect(() => {
    let isMounted = true

    const calculateValues = async () => {
      if (!portfolio || portfolio.length === 0) {
        if (isMounted) {
          setHoldings([])
          setTotalValue(0)
          setTotalProfit(0)
          setTotalProfitPercent(0)
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const coinIds = portfolio.map(p => p.coinId)
        const cryptoData = await fetchMultipleCrypto(coinIds)

        if (!isMounted) return

        const calculatedHoldings = cryptoData.map(crypto => {
          const holding = portfolio.find(p => p.coinId === crypto.id)
          if (!holding) return null

          const currentValue = crypto.price * holding.amount
          const entryValue = holding.entryPrice * holding.amount
          const profit = currentValue - entryValue
          const profitPercent = entryValue > 0 ? (profit / entryValue) * 100 : 0

          return {
            ...crypto, // Includes id, name, symbol, image, price, change, high24h, low24h
            amount: holding.amount,
            entryPrice: holding.entryPrice,
            value: currentValue,
            profit: profit,
            profitPercent: profitPercent,
            change24h: crypto.change // Explicit alias for clarity
          }
        }).filter(Boolean)

        const tValue = calculatedHoldings.reduce((sum, h) => sum + h.value, 0)
        const tEntry = calculatedHoldings.reduce((sum, h) => sum + h.entryPrice * h.amount, 0)
        const tProfit = tValue - tEntry
        const tProfitPercent = tEntry > 0 ? (tProfit / tEntry) * 100 : 0

        setHoldings(calculatedHoldings)
        setTotalValue(tValue)
        setTotalProfit(tProfit)
        setTotalProfitPercent(tProfitPercent)

      } catch (err) {
        console.error("Error calculating portfolio values:", err)
        if (isMounted) setError("Failed to update prices")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    calculateValues()

    // Refresh prices every 60s
    const interval = setInterval(calculateValues, 60000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }

  }, [portfolio]) // Re-run when portfolio changes (instantly updates UI on buy/sell)

  return {
    holdings,
    totalValue,
    totalProfit,
    totalProfitPercent,
    loading,
    error
  }
}
