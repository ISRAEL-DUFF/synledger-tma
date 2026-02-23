// payment-helpers-complete.ts
// Complete payment helper functions with proper chain/token detection

import { parseUnits, encodeFunctionData } from 'viem';
import { SupportedChain } from '@/lib/chains-config';
import { getContractByName, ABIS } from '@/lib/contracts';
import { ethers } from 'ethers';
import { readContract, writeContract, sendTransaction, waitForTransactionReceipt, getBalance, getBytecode, estimateGas, switchChain, getChainId } from '@wagmi/core';
import { wagmiAdapter } from './web3modal-config';

const ESCROW_ABI = ABIS.escrowManager;
const ERC20_ABI = ABIS.erc20;

/**
 * Payment transaction parameters
 */
export interface PaymentParams {
    chain: SupportedChain;
    tokenSymbol: 'USDT' | 'USDC' | 'ETH' | 'native';
    amount: string;
    fromAddress: string;
    toAddress: string; // Usually your escrow contract
    reference: string; // Payment intent ID
    category: string;
}

/**
 * Main function: Build and sign payment transaction
 * This is chain-aware and token-aware
 */
export async function buildAndSignPayment(
    params: PaymentParams
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const { chain, tokenSymbol, amount, fromAddress, toAddress } = params;

    try {
        console.log('💳 Building payment transaction:', {
            chain,
            token: tokenSymbol,
            amount,
            from: fromAddress,
            to: toAddress,
        });

        // Step 1: Check if token approval is needed (for ERC20)
        // Note: We do this before building the main transaction
        if (tokenSymbol !== 'native' && tokenSymbol !== 'ETH') {
            const approved = await ensureTokenApproval(params);
            if (!approved) {
                return {
                    success: false,
                    error: 'Token approval rejected',
                };
            }
        }

        // Step 2: Build and send the transaction
        // We now combine build & send because wagmi handles it better
        const txHash = await sendPaymentTransaction(params);

        if (!txHash) {
            return {
                success: false,
                error: 'User rejected transaction',
            };
        }

        console.log('✅ Transaction confirmed/sent:', txHash);

        return {
            success: true,
            txHash,
        };
    } catch (error: any) {
        console.error('❌ Payment error:', error);
        return {
            success: false,
            error: error.message || 'Payment failed',
        };
    }
}

/**
 * Send payment transaction using Wagmi Core
 */
async function sendPaymentTransaction(params: PaymentParams): Promise<string | null> {
    const { chain, tokenSymbol, amount, fromAddress, reference, category } = params;

    const contractByChain = getContractByName(chain);
    const { chainId } = contractByChain;
    // Find chain object from config to satisfy Wagmi types
    const chainObj = wagmiAdapter.wagmiConfig.chains.find(c => c.id === chainId);
    const escrowAddress = contractByChain.escrowManager;

    // Handle EVM chains
    if (['ethereum', 'arbitrum', 'base', 'bsc'].includes(chain)) {
        console.log('Sending EVM transaction...');

        // Verify Chain
        const currentChainId = getChainId(wagmiAdapter.wagmiConfig);
        if (currentChainId !== chainId) {
            console.log(`Switching chain from ${currentChainId} to ${chainId}...`);
            try {
                await switchChain(wagmiAdapter.wagmiConfig, { chainId });
            } catch (error) {
                console.error('Chain switch failed:', error);
                return null;
            }
        }

        // Get token address
        let tokenAddress: string;
        let decimals: number;

        if (tokenSymbol === 'native' || tokenSymbol === 'ETH') {
            tokenAddress = '0x0000000000000000000000000000000000000000';
            decimals = 18;
        } else {
            tokenAddress = tokenSymbol === 'USDT' ? contractByChain.usdt : contractByChain.usdc;
            decimals = 6;
        }

        const amountInWei = parseUnits(amount, decimals);
        const paymentReferenceBytes = ethers.encodeBytes32String(reference);

        try {
            const hash = await writeContract(wagmiAdapter.wagmiConfig, {
                chainId,
                chain: chainObj, // Explicit chain object
                account: fromAddress as `0x${string}`,
                address: escrowAddress as `0x${string}`,
                abi: ESCROW_ABI,
                functionName: 'createEscrow',
                args: [tokenAddress, amountInWei, paymentReferenceBytes, category],
                value: (tokenSymbol === 'native' || tokenSymbol === 'ETH') ? amountInWei : 0n,
            });

            return hash;
        } catch (error: any) {
            if (error.code === 4001 || error.message?.includes('User denied')) {
                console.log('❌ User rejected transaction');
                return null;
            }
            throw error;
        }
    }

    // Tron handling
    if (chain === 'tron') {
        return buildTronTransaction(params);
    }

    throw new Error(`Unsupported chain: ${chain}`);
}

/**
 * Build Tron transaction (Legacy / window.tronWeb)
 */
async function buildTronTransaction(params: PaymentParams): Promise<any> {
    const { tokenSymbol, amount, fromAddress, reference, category } = params;

    if (!window.tronWeb || !window.tronWeb.ready) {
        throw new Error('TronLink not connected');
    }

    const tronWeb = window.tronWeb;
    const contractByChain = getContractByName('tron');

    if (tokenSymbol === 'native') {
        const amountSun = tronWeb.toSun(amount);
        const contract = await tronWeb.contract().at(contractByChain.escrowManager);
        const tx = await contract.createEscrow(
            'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
            amountSun,
            reference,
            category
        ).send({ from: fromAddress, callValue: amountSun });
        return tx;
    } else {
        const tokenAddress = tokenSymbol === 'USDT' ? contractByChain.usdt : contractByChain.usdc;
        const decimals = 6;
        const amountInSmallestUnit = parseFloat(amount) * Math.pow(10, decimals);
        const contract = await tronWeb.contract().at(contractByChain.escrowManager);
        const tx = await contract.createEscrow(
            tokenAddress,
            amountInSmallestUnit,
            reference,
            category
        ).send({ from: fromAddress });
        return tx;
    }
}

/**
 * Ensure token approval for ERC20 transfers
 */
async function ensureTokenApproval(params: PaymentParams): Promise<boolean> {
    const { chain, tokenSymbol, amount, fromAddress } = params;

    if (tokenSymbol === 'native' || tokenSymbol === 'ETH') {
        return true;
    }

    const contractByChain = getContractByName(chain);
    const escrowAddress = contractByChain.escrowManager;
    const tokenAddress = tokenSymbol === 'USDT' ? contractByChain.usdt : contractByChain.usdc;
    const decimals = 6;
    const amountInWei = parseUnits(amount, decimals);

    console.log('🔍 Checking token approval...', { token: tokenSymbol, amount });

    try {
        const currentAllowance = await checkAllowance(
            tokenAddress,
            fromAddress,
            escrowAddress,
            chain
        );

        console.log('Current allowance:', currentAllowance.toString());

        if (currentAllowance >= amountInWei) {
            console.log('✅ Sufficient allowance already exists');
            return true;
        }

        console.log('📝 Requesting token approval...');
        const approved = await approveToken(
            tokenAddress,
            escrowAddress,
            amount,
            fromAddress,
            chain
        );

        if (!approved) {
            console.log('❌ User rejected approval');
            return false;
        }

        console.log('✅ Token approved successfully');
        await waitForTransactionConfirmation(approved, chain);
        return true;
    } catch (error) {
        console.error('❌ Approval check failed:', error);
        throw error;
    }
}

/**
 * Check ERC20 allowance using Wagmi Core
 */
async function checkAllowance(
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string,
    chain: SupportedChain
): Promise<bigint> {
    // Tron check
    if (chain === 'tron') {
        // ... implementation for Tron if needed
        return 0n; // Placeholder
    }

    const { chainId } = getContractByName(chain);

    try {
        // @ts-ignore
        const result = await readContract(wagmiAdapter.wagmiConfig, {
            chainId,
            account: ownerAddress as `0x${string}`,
            address: tokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [ownerAddress as `0x${string}`, spenderAddress as `0x${string}`],
        });
        return result as bigint;
    } catch (error) {
        console.error('Check allowance error:', error);
        return 0n;
    }
}

/**
 * Approve ERC20 token using Wagmi Core
 */
async function approveToken(
    tokenAddress: string,
    spenderAddress: string,
    amount: string,
    fromAddress: string,
    chain: SupportedChain
): Promise<string | null> {
    // Tron check
    if (chain === 'tron') return null;

    const { chainId } = getContractByName(chain);
    const chainObj = wagmiAdapter.wagmiConfig.chains.find(c => c.id === chainId);

    // Verify Chain
    const currentChainId = getChainId(wagmiAdapter.wagmiConfig);
    if (currentChainId !== chainId) {
        console.log(`Switching chain from ${currentChainId} to ${chainId}...`);
        try {
            await switchChain(wagmiAdapter.wagmiConfig, { chainId });
        } catch (error) {
            console.error('Chain switch failed:', error);
            return null;
        }
    }

    try {
        const decimals = 6;
        const amountInWei = parseUnits(amount, decimals);

        const hash = await writeContract(wagmiAdapter.wagmiConfig, {
            chainId,
            chain: chainObj,
            account: fromAddress as `0x${string}`,
            address: tokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [spenderAddress as `0x${string}`, amountInWei],
        });

        return hash;
    } catch (error: any) {
        if (error.code === 4001 || error.message?.includes('User denied')) {
            return null;
        }
        throw error;
    }
}

/**
 * Wait for transaction confirmation using Wagmi Core
 */
async function waitForTransactionConfirmation(
    txHash: string,
    chain: SupportedChain,
    maxWaitSeconds: number = 60
): Promise<void> {
    console.log('⏳ Waiting for transaction confirmation...', txHash);

    if (chain === 'tron') return; // Tron logic different

    const { chainId } = getContractByName(chain);
    const chainObj = wagmiAdapter.wagmiConfig.chains.find(c => c.id === chainId);

    try {
        const receipt = await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, {
            chainId,
            hash: txHash as `0x${string}`,
            timeout: maxWaitSeconds * 1000,
        });

        if (receipt.status === 'success') {
            console.log('✅ Transaction confirmed');
        } else {
            throw new Error('Transaction failed on-chain');
        }
    } catch (error) {
        console.error('Error waiting for transaction:', error);
        throw error;
    }
}

/**
 * Debug approval function (Updated for Wagmi)
 */
export async function approveTokenDebug(
    tokenAddress: string,
    spenderAddress: string,
    amount: string,
    fromAddress: string,
    chain: string
): Promise<string | null> {
    console.log('🔍 APPROVAL DEBUG START (Wagmi Core)');

    // Check ETH balance
    try {
        const balance = await getBalance(wagmiAdapter.wagmiConfig, {
            address: fromAddress as `0x${string}`,
        });
        console.log('ETH balance:', balance.formatted, balance.symbol);
    } catch (e) {
        console.warn('Could not check balance', e);
    }

    // Check contract code
    try {
        const code = await getBytecode(wagmiAdapter.wagmiConfig, {
            address: tokenAddress as `0x${string}`,
        });
        if (!code || code === '0x') {
            console.error('❌ NO CONTRACT AT THIS ADDRESS!');
            throw new Error('No contract code found');
        }
        console.log('✅ Contract exists at token address');
    } catch (e) {
        console.error('Code check failed', e);
    }

    try {
        const decimals = 6;
        const amountInWei = parseUnits(amount, decimals);

        // Estimate Gas
        try {
            await estimateGas(wagmiAdapter.wagmiConfig, {
                to: tokenAddress as `0x${string}`,
                data: encodeFunctionData({
                    abi: ERC20_ABI,
                    functionName: 'approve',
                    args: [spenderAddress as `0x${string}`, amountInWei],
                }),
                account: fromAddress as `0x${string}`
            });
            console.log('✅ Gas estimation effective');
        } catch (e) {
            console.error('❌ Gas estimation failed - transaction will revert', e);
            throw e;
        }

        const hash = await writeContract(wagmiAdapter.wagmiConfig, {
            address: tokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [spenderAddress as `0x${string}`, amountInWei],
        });

        console.log('✅ Transaction sent:', hash);
        return hash;
    } catch (error: any) {
        console.error('❌ Approval failed:', error);
        if (error.code === 4001 || error.message?.includes('User denied')) {
            return null;
        }
        throw error;
    }
}

export function getTokenInfo(
    chain: SupportedChain,
    tokenSymbol: 'USDT' | 'USDC' | 'ETH' | 'native'
): { address: string; decimals: number } {
    const contractByChain = getContractByName(chain);

    if (tokenSymbol === 'native' || tokenSymbol === 'ETH') {
        return {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18,
        };
    }

    const address = tokenSymbol === 'USDT' ? contractByChain.usdt : contractByChain.usdc;

    return {
        address,
        decimals: 6,
    };
}

declare global {
    interface Window {
        ethereum?: any;
        tronWeb?: any;
    }
}