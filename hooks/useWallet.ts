import { useState, useEffect } from 'react';
import walletService from '../services/walletService';

export function useWallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const walletData = await walletService.getWallet();
      if (walletData) {
        setBalance(walletData.balance || 0);
        setTransactions(walletData.transactions || []);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFunds = async (amount: number) => {
    try {
      setLoading(true);
      // Usar Webpay en lugar de simulación
      const result = await walletService.initiateTransbankDeposit(amount);
      return result; // { url, token, paymentId }
    } catch (error) {
      console.error('Error adding funds:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    balance,
    transactions,
    loading,
    refresh: loadWallet,
    addFunds
  };
}
