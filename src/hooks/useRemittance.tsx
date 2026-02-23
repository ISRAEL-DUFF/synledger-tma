import { useState, useEffect, useCallback } from 'react';
import {
  SavedRecipient,
  RemittanceTransaction,
  ExchangeRate,
  mockExchangeRates,
  getSavedRecipients,
  addRecipient,
  deleteRecipient,
  updateRecipientLastUsed,
  getRecentTransactions,
  saveTransaction,
  calculateFee,
  TRANSACTION_LIMITS,
} from '@/lib/remittanceData';
import { useExchangeRate } from '@/hooks/useExchangeRate';

export function useRemittance() {
  const [recipients, setRecipients] = useState<SavedRecipient[]>([]);
  const [transactions, setTransactions] = useState<RemittanceTransaction[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>(mockExchangeRates);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch dynamic exchange rate
  const { data: exchangeRateData } = useExchangeRate('USDT', 'NGN');

  // Load data on mount
  useEffect(() => {
    setRecipients(getSavedRecipients());
    setTransactions(getRecentTransactions());
  }, []);

  // Refresh exchange rates (mock implementation)
  const refreshExchangeRates = useCallback(() => {
    // In production, fetch from API
    // Adding slight variance to simulate real rates
    const variance = (Math.random() - 0.5) * 10;

    // If we have real data, update the rates
    if (exchangeRateData?.effectiveRate) {
      setExchangeRates([
        { token: 'USDT', rate: exchangeRateData.effectiveRate, lastUpdated: new Date() },
        { token: 'USDC', rate: exchangeRateData.effectiveRate, lastUpdated: new Date() },
      ]);
    } else {
      setExchangeRates([
        { token: 'USDT', rate: 1580 + variance, lastUpdated: new Date() },
        { token: 'USDC', rate: 1575 + variance, lastUpdated: new Date() },
      ]);
    }
  }, [exchangeRateData]);

  // Sync with hook data automatically
  useEffect(() => {
    if (exchangeRateData?.effectiveRate) {
      setExchangeRates([
        { token: 'USDT', rate: exchangeRateData.effectiveRate, lastUpdated: new Date() },
        { token: 'USDC', rate: exchangeRateData.effectiveRate, lastUpdated: new Date() },
      ]);
    }
  }, [exchangeRateData]);

  // Get rate for specific token
  const getRate = useCallback((token: 'USDT' | 'USDC'): number => {
    const rate = exchangeRates.find(r => r.token === token);
    return rate?.rate ?? (exchangeRateData?.effectiveRate || 1580);
  }, [exchangeRates, exchangeRateData]);

  // Calculate conversion
  const calculateConversion = useCallback((amountUsd: number, token: 'USDT' | 'USDC') => {
    const rate = getRate(token);
    const fee = calculateFee(amountUsd);
    const netAmount = amountUsd - fee;
    const amountNgn = netAmount * rate;

    return {
      amountUsd,
      fee,
      netAmount,
      rate,
      amountNgn,
      effectiveRate: amountNgn / amountUsd, // What recipient actually gets per $1 sent
    };
  }, [getRate]);

  // Add new recipient
  const handleAddRecipient = useCallback((
    recipient: Omit<SavedRecipient, 'id' | 'createdAt'>
  ): SavedRecipient => {
    const newRecipient = addRecipient(recipient);
    setRecipients(getSavedRecipients());
    return newRecipient;
  }, []);

  // Delete recipient
  const handleDeleteRecipient = useCallback((recipientId: string) => {
    deleteRecipient(recipientId);
    setRecipients(getSavedRecipients());
  }, []);

  // Create transaction (mock - in production this would interact with smart contract)
  const createTransaction = useCallback(async (
    recipient: SavedRecipient,
    amountUsd: number,
    token: 'USDT' | 'USDC',
    note?: string
  ): Promise<RemittanceTransaction> => {
    setIsLoading(true);

    const conversion = calculateConversion(amountUsd, token);

    const transaction: RemittanceTransaction = {
      id: crypto.randomUUID(),
      recipientId: recipient.id,
      recipientName: recipient.fullName,
      bankName: recipient.bankName,
      accountNumber: recipient.accountNumber,
      amountUsd,
      amountNgn: conversion.amountNgn,
      exchangeRate: conversion.rate,
      fee: conversion.fee,
      token,
      status: 'pending',
      createdAt: new Date(),
      note,
    };

    // Save transaction
    saveTransaction(transaction);
    setTransactions(getRecentTransactions());

    // Update recipient last used
    updateRecipientLastUsed(recipient.id);
    setRecipients(getSavedRecipients());

    setIsLoading(false);
    return transaction;
  }, [calculateConversion]);

  // Validate amount
  const validateAmount = useCallback((amount: number): { valid: boolean; error?: string } => {
    if (isNaN(amount) || amount <= 0) {
      return { valid: false, error: 'Please enter a valid amount' };
    }
    if (amount < TRANSACTION_LIMITS.min) {
      return { valid: false, error: `Minimum amount is $${TRANSACTION_LIMITS.min}` };
    }
    if (amount > TRANSACTION_LIMITS.max) {
      return { valid: false, error: `Maximum amount is $${TRANSACTION_LIMITS.max.toLocaleString()}` };
    }
    return { valid: true };
  }, []);

  return {
    recipients,
    transactions,
    exchangeRates,
    isLoading,
    limits: TRANSACTION_LIMITS,
    refreshExchangeRates,
    getRate,
    calculateConversion,
    calculateFee,
    addRecipient: handleAddRecipient,
    deleteRecipient: handleDeleteRecipient,
    createTransaction,
    validateAmount,
  };
}
