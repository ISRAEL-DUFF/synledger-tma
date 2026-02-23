// Remittance-specific data and types

export interface SavedRecipient {
  id: string;
  nickname: string;
  fullName: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  createdAt: Date;
  lastUsed?: Date;
}

export interface RemittanceTransaction {
  id: string;
  recipientId: string;
  recipientName: string;
  bankName: string;
  accountNumber: string;
  amountUsd: number;
  amountNgn: number;
  exchangeRate: number;
  fee: number;
  token: 'USDT' | 'USDC';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  createdAt: Date;
  completedAt?: Date;
  note?: string;
}

export interface ExchangeRate {
  token: 'USDT' | 'USDC';
  rate: number;
  lastUpdated: Date;
}

// Supported corridors
export const supportedCorridors = [
  { from: 'US', to: 'NG', fromCurrency: 'USD', toCurrency: 'NGN' },
  { from: 'UK', to: 'NG', fromCurrency: 'GBP', toCurrency: 'NGN' },
  { from: 'CA', to: 'NG', fromCurrency: 'CAD', toCurrency: 'NGN' },
  { from: 'AE', to: 'NG', fromCurrency: 'AED', toCurrency: 'NGN' },
] as const;

// Mock exchange rates (in production, fetch from API)
export const mockExchangeRates: ExchangeRate[] = [
  { token: 'USDT', rate: 1580, lastUpdated: new Date() },
  { token: 'USDC', rate: 1575, lastUpdated: new Date() },
];

// Fee structure: 1.5% with minimum $0.50
export const calculateFee = (amountUsd: number): number => {
  const percentageFee = amountUsd * 0.015;
  return Math.max(percentageFee, 0.50);
};

// Transaction limits
export const TRANSACTION_LIMITS = {
  min: 50,    // $50 minimum
  max: 10000, // $10,000 maximum per transaction
  dailyMax: 25000, // $25,000 daily limit
};

// Local storage keys
export const STORAGE_KEYS = {
  savedRecipients: 'synledger_remittance_recipients',
  recentTransactions: 'synledger_remittance_transactions',
};

// Helper to get saved recipients from localStorage
export const getSavedRecipients = (): SavedRecipient[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.savedRecipients);
    if (!data) return [];
    const recipients = JSON.parse(data);
    return recipients.map((r: SavedRecipient) => ({
      ...r,
      createdAt: new Date(r.createdAt),
      lastUsed: r.lastUsed ? new Date(r.lastUsed) : undefined,
    }));
  } catch {
    return [];
  }
};

// Helper to save recipients to localStorage
export const saveRecipients = (recipients: SavedRecipient[]): void => {
  localStorage.setItem(STORAGE_KEYS.savedRecipients, JSON.stringify(recipients));
};

// Helper to add a new recipient
export const addRecipient = (recipient: Omit<SavedRecipient, 'id' | 'createdAt'>): SavedRecipient => {
  const newRecipient: SavedRecipient = {
    ...recipient,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };
  const recipients = getSavedRecipients();
  recipients.unshift(newRecipient);
  saveRecipients(recipients);
  return newRecipient;
};

// Helper to update last used timestamp
export const updateRecipientLastUsed = (recipientId: string): void => {
  const recipients = getSavedRecipients();
  const index = recipients.findIndex(r => r.id === recipientId);
  if (index !== -1) {
    recipients[index].lastUsed = new Date();
    saveRecipients(recipients);
  }
};

// Helper to delete a recipient
export const deleteRecipient = (recipientId: string): void => {
  const recipients = getSavedRecipients().filter(r => r.id !== recipientId);
  saveRecipients(recipients);
};

// Get recent transactions from localStorage
export const getRecentTransactions = (): RemittanceTransaction[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.recentTransactions);
    if (!data) return [];
    const transactions = JSON.parse(data);
    return transactions.map((t: RemittanceTransaction) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
    }));
  } catch {
    return [];
  }
};

// Save transaction to localStorage
export const saveTransaction = (transaction: RemittanceTransaction): void => {
  const transactions = getRecentTransactions();
  transactions.unshift(transaction);
  // Keep only last 50 transactions
  const trimmed = transactions.slice(0, 50);
  localStorage.setItem(STORAGE_KEYS.recentTransactions, JSON.stringify(trimmed));
};
