import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
    getChips,
    updateChips,
    getPortfolio,
    addToPortfolio,
    removeFromPortfolio,
    getTransactions,
    addTransaction
} from '../services/chipsService'

const UserContext = createContext()

export const useUser = () => {
    const context = useContext(UserContext)
    if (!context) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}

export const UserProvider = ({ children }) => {
    const [chips, setChips] = useState(0)
    const [portfolio, setPortfolio] = useState([])
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)

    // Load initial data
    const loadData = useCallback(() => {
        setChips(getChips())
        setPortfolio(getPortfolio())
        setTransactions(getTransactions())
        setLoading(false)
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Actions
    const buyCrypto = useCallback((crypto, amount, totalCost) => {
        // 1. Update chips
        const newChips = updateChips(-totalCost)
        setChips(newChips)

        // 2. Update portfolio
        addToPortfolio(crypto, amount, crypto.price)
        setPortfolio(getPortfolio()) // Reload from storage to ensure sync

        // 3. Add transaction
        // Note: profit is 0 for buy
        addTransaction('buy', crypto, amount, crypto.price, totalCost, 0)
        setTransactions(getTransactions())

        return true
    }, [])

    const sellCrypto = useCallback((crypto, amount, totalValue, holding) => {
        const profit = totalValue - (holding.entryPrice * amount)

        // 1. Update chips
        const newChips = updateChips(totalValue)
        setChips(newChips)

        // 2. Update portfolio
        removeFromPortfolio(crypto.id, amount)
        setPortfolio(getPortfolio())

        // 3. Add transaction
        addTransaction('sell', crypto, amount, crypto.price, totalValue, profit)
        setTransactions(getTransactions())

        return profit
    }, [])

    const value = {
        chips,
        portfolio,
        transactions,
        loading,
        buyCrypto,
        sellCrypto,
        refreshData: loadData
    }

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    )
}
