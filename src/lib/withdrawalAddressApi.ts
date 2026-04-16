import { api } from "@/lib/api";

export type WithdrawalAddressChain =
  | "ethereum"
  | "bsc"
  | "polygon"
  | "arbitrum"
  | "base"
  | "tron"
  | "solana";

export type WithdrawalAddressToken = "USDT" | "USDC";

export interface WithdrawalAddress {
  id: string;
  label: string;
  address: string;
  chain: WithdrawalAddressChain;
  token: WithdrawalAddressToken;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWithdrawalAddressPayload {
  label: string;
  address: string;
  chain: WithdrawalAddressChain;
  token: WithdrawalAddressToken;
}

interface WithdrawalAddressesResponse {
  success: boolean;
  data: WithdrawalAddress[];
}

interface WithdrawalAddressResponse {
  success: boolean;
  data: WithdrawalAddress;
}

export async function getWithdrawalAddresses(): Promise<WithdrawalAddress[]> {
  const response = await api.get<WithdrawalAddressesResponse>("/withdrawal-addresses");
  return response.data;
}

export async function createWithdrawalAddress(payload: CreateWithdrawalAddressPayload): Promise<WithdrawalAddress> {
  const response = await api.post<WithdrawalAddressResponse>("/withdrawal-addresses", payload);
  return response.data;
}

export async function deleteWithdrawalAddress(id: string): Promise<void> {
  await api.delete(`/withdrawal-addresses/${id}`);
}
