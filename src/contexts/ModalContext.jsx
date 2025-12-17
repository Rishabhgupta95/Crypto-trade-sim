import { createContext, useContext, useState } from 'react'
import BuySellModal from '../components/BuySellModal'

const ModalContext = createContext()

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

export const ModalProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCrypto, setSelectedCrypto] = useState(null)
  const [initialMode, setInitialMode] = useState('buy')

  const openModal = (crypto, mode = 'buy') => {
    setSelectedCrypto(crypto)
    setInitialMode(mode)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedCrypto(null)
  }

  const handleTransaction = () => {
    // This will be called when a transaction completes
    closeModal()
  }

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <BuySellModal
        crypto={selectedCrypto}
        isOpen={isModalOpen}
        onClose={closeModal}
        onTransaction={handleTransaction}
        initialMode={initialMode}
      />
    </ModalContext.Provider>
  )
}