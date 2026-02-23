export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceType = 'simple' | 'milestone' | 'recurring' | 'quote';
export type CryptoToken = 'USDT' | 'USDC';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'released';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  
  // Client details
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  
  // Invoice details
  title: string;
  description?: string;
  lineItems: LineItem[];
  milestones?: Milestone[];
  
  // Amounts
  subtotal: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  tax?: number;
  taxType?: 'percentage' | 'fixed';
  total: number;
  
  // Payment
  acceptedTokens: CryptoToken[];
  walletAddress: string;
  
  // Dates
  issueDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  
  // Recurring (if applicable)
  recurringInterval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recurringEndDate?: string;
  
  // Notes
  notes?: string;
  termsAndConditions?: string;
}

export interface InvoiceClient {
  id: string;
  name: string;
  email: string;
  company?: string;
  invoiceCount: number;
  totalPaid: number;
  createdAt: string;
}

// Generate invoice number
export const generateInvoiceNumber = (): string => {
  const prefix = 'INV';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Calculate invoice totals
export const calculateInvoiceTotals = (
  lineItems: LineItem[],
  discount?: number,
  discountType?: 'percentage' | 'fixed',
  tax?: number,
  taxType?: 'percentage' | 'fixed'
): { subtotal: number; discountAmount: number; taxAmount: number; total: number } => {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  
  let discountAmount = 0;
  if (discount) {
    discountAmount = discountType === 'percentage' 
      ? (subtotal * discount) / 100 
      : discount;
  }
  
  const afterDiscount = subtotal - discountAmount;
  
  let taxAmount = 0;
  if (tax) {
    taxAmount = taxType === 'percentage' 
      ? (afterDiscount * tax) / 100 
      : tax;
  }
  
  const total = afterDiscount + taxAmount;
  
  return { subtotal, discountAmount, taxAmount, total };
};

// Format currency
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Get status color
export const getStatusColor = (status: InvoiceStatus): string => {
  switch (status) {
    case 'draft':
      return 'bg-muted text-muted-foreground';
    case 'sent':
      return 'bg-blue-500/20 text-blue-400';
    case 'viewed':
      return 'bg-purple-500/20 text-purple-400';
    case 'paid':
      return 'bg-green-500/20 text-green-400';
    case 'overdue':
      return 'bg-red-500/20 text-red-400';
    case 'cancelled':
      return 'bg-gray-500/20 text-gray-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

// Get invoice type label
export const getInvoiceTypeLabel = (type: InvoiceType): string => {
  switch (type) {
    case 'simple':
      return 'Simple Invoice';
    case 'milestone':
      return 'Milestone Invoice';
    case 'recurring':
      return 'Recurring Invoice';
    case 'quote':
      return 'Quote/Estimate';
    default:
      return 'Invoice';
  }
};

// Local storage helpers
const INVOICES_KEY = 'synledger_invoices';
const CLIENTS_KEY = 'synledger_invoice_clients';

export const getStoredInvoices = (): Invoice[] => {
  const stored = localStorage.getItem(INVOICES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveInvoices = (invoices: Invoice[]): void => {
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
};

export const getStoredClients = (): InvoiceClient[] => {
  const stored = localStorage.getItem(CLIENTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveClients = (clients: InvoiceClient[]): void => {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
};

// Check if invoice is overdue
export const isInvoiceOverdue = (invoice: Invoice): boolean => {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') {
    return false;
  }
  return new Date(invoice.dueDate) < new Date();
};

// Default terms and conditions
export const defaultTerms = `Payment is due within the specified timeframe. Late payments may incur additional fees.

All payments are processed through blockchain and are final once confirmed.

For disputes or questions, please contact us within 48 hours of invoice receipt.`;
