import { Transaction } from "@/components/TransactionList";

// Mock data for development
export const mockTransactions: Transaction[] = [
  {
    id: "1",
    category: "groceries",
    description: "Payment to GTBank - 0123456789",
    amountNgn: 45000,
    amountUsd: 31.69,
    status: "confirmed",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    txHash: "0x1234567890abcdef1234567890abcdef12345678",
    recipient: "John Doe",
  },
  {
    id: "2",
    category: "airtime",
    description: "MTN Airtime - 08012345678",
    amountNgn: 2000,
    amountUsd: 1.41,
    status: "confirmed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    txHash: "0xabcdef1234567890abcdef1234567890abcdef12",
  },
  {
    id: "3",
    category: "electricity",
    description: "IKEDC Prepaid - 45678901234",
    amountNgn: 15000,
    amountUsd: 10.56,
    status: "pending",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: "4",
    category: "cable",
    description: "DSTV Premium - 7890123456",
    amountNgn: 29500,
    amountUsd: 20.77,
    status: "confirmed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    txHash: "0x567890abcdef1234567890abcdef1234567890ab",
  },
  {
    id: "5",
    category: "internet",
    description: "Spectranet - SPEC12345",
    amountNgn: 18000,
    amountUsd: 12.68,
    status: "confirmed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    txHash: "0xcdef1234567890abcdef1234567890abcdef1234",
  },
  {
    id: "6",
    category: "transfer",
    description: "Payment to Access Bank - 9876543210",
    amountNgn: 125000,
    amountUsd: 88.03,
    status: "failed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
  },
  {
    id: "7",
    category: "deposit",
    description: "Deposit from External Wallet",
    amountNgn: 500000,
    amountUsd: 352.11,
    status: "confirmed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96),
    txHash: "0x890abcdef1234567890abcdef1234567890abcde",
  },
];

export const nigerianBanks = [
  { code: "058", name: "GTBank", logo: "gtbank" },
  { code: "033", name: "United Bank for Africa", logo: "uba" },
  { code: "044", name: "Access Bank", logo: "access" },
  { code: "011", name: "First Bank", logo: "firstbank" },
  { code: "057", name: "Zenith Bank", logo: "zenith" },
  { code: "032", name: "Union Bank", logo: "union" },
  { code: "030", name: "Heritage Bank", logo: "heritage" },
  { code: "070", name: "Fidelity Bank", logo: "fidelity" },
  { code: "076", name: "Polaris Bank", logo: "polaris" },
  { code: "221", name: "Stanbic IBTC", logo: "stanbic" },
  { code: "035", name: "Wema Bank", logo: "wema" },
  { code: "082", name: "Keystone Bank", logo: "keystone" },
  { code: "068", name: "Standard Chartered", logo: "sc" },
  { code: "232", name: "Sterling Bank", logo: "sterling" },
  { code: "101", name: "Providus Bank", logo: "providus" },
  { code: "214", name: "FCMB", logo: "fcmb" },
  { code: "304", name: "Moniepoint", logo: "moniepoint" },
  { code: "999", name: "Opay", logo: "opay" },
  { code: "301", name: "PalmPay", logo: "palmpay" },
  { code: "100", name: "Kuda Bank", logo: "kuda" },
];

export const networkProviders = [
  { id: "mtn", name: "MTN", color: "bg-network-mtn" },
  { id: "airtel", name: "Airtel", color: "bg-network-airtel" },
  { id: "glo", name: "Glo", color: "bg-network-glo" },
  { id: "9mobile", name: "9mobile", color: "bg-network-mobile" },
];

export const billCategories = [
  {
    id: "electricity",
    name: "Electricity",
    providers: [
      { id: "ikedc", name: "IKEDC (Ikeja Electric)" },
      { id: "ekedc", name: "EKEDC (Eko Electric)" },
      { id: "aedc", name: "AEDC (Abuja Electric)" },
      { id: "kedco", name: "KEDCO (Kaduna Electric)" },
      { id: "phed", name: "PHED (Port Harcourt)" },
      { id: "ibedc", name: "IBEDC (Ibadan Electric)" },
    ],
  },
  {
    id: "cable",
    name: "Cable TV",
    providers: [
      { id: "dstv", name: "DSTV" },
      { id: "gotv", name: "GOtv" },
      { id: "startimes", name: "StarTimes" },
      { id: "showmax", name: "Showmax" },
    ],
  },
  {
    id: "internet",
    name: "Internet",
    providers: [
      { id: "spectranet", name: "Spectranet" },
      { id: "smile", name: "Smile" },
      { id: "swift", name: "Swift" },
      { id: "ipnx", name: "ipNX" },
    ],
  },
];

export const currentExchangeRate = 1420; // NGN per USDT

export const airtimeAmountPresets = [100, 200, 500, 1000, 2000, 5000];
