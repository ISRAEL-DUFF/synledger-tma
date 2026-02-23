// hooks/usePaymentIntent.ts
// React hook for managing payment intents

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export enum PaymentIntentStatus {
    CREATED = 'CREATED',
    PENDING_SIGNATURE = 'PENDING_SIGNATURE',
    SIGNED = 'SIGNED',
    BROADCASTING = 'BROADCASTING',
    PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
    CONFIRMED = 'CONFIRMED',
    FAILED = 'FAILED',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
}

export interface PaymentIntent {
    id: string;
    userId: string;
    reference?: string;
    chain: string;
    fromAddress: string;
    toAddress: string;
    amount: string;
    tokenAddress?: string;
    tokenSymbol?: string;
    status: PaymentIntentStatus;
    txHash?: string;
    confirmations?: number;
    errorMessage?: string;
    isTerminal?: boolean;
    canRetry?: boolean;
    createdAt: string;
    expiresAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const usePaymentIntent = (existingIntentId?: string) => {
    const [intentId, setIntentId] = useState<string | null>(existingIntentId);
    const [intent, setIntent] = useState<PaymentIntent | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const socket = useSocket();
    const { token, user } = useAuth();

    // Reset intent state when intentId changes
    useEffect(() => {
        setIntent(null);
        setError(null);
    }, [intentId]);

    // Fetch intent details
    const fetchIntent = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/payment-intents/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch payment intent');
            }

            const data = await response.json();
            setIntent(data.data);
        } catch (err: any) {
            setError(err.message);
            toast.error('Failed to load payment intent');
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Create a new payment intent
    const createIntent = useCallback(async (params: {
        chain: string;
        fromAddress: string;
        toAddress: string;
        amount: string;
        tokenAddress?: string;
        tokenSymbol?: string;
        metadata?: any;
    }) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/payment-intents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...params,
                    userId: user.id,
                    paymentType: params.tokenAddress ? 'TOKEN' : 'NATIVE',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create payment intent');
            }

            const data = await response.json();
            setIntent(data.data);
            setIntentId(data.data.id);
            toast.success('Payment intent created');
            return data.data;
        } catch (err: any) {
            setError(err.message);
            toast.error('Failed to create payment intent');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [token, user]);

    // Submit signed transaction
    const submitTransaction = useCallback(async (id: string, signedTx: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/payment-intents/${id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ signedTx }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit transaction');
            }

            const data = await response.json();

            if (data.success) {
                toast.success('Transaction submitted successfully');
                return data.data;
            } else {
                throw new Error(data.error || 'Transaction submission failed');
            }
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Cancel payment intent
    const cancelIntent = useCallback(async (id: string, reason?: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/payment-intents/${id}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ reason }),
            });

            if (!response.ok) {
                throw new Error('Failed to cancel payment intent');
            }

            const data = await response.json();
            setIntent(data.data);
            toast.success('Payment cancelled');
            return data.data;
        } catch (err: any) {
            setError(err.message);
            toast.error('Failed to cancel payment');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Subscribe to real-time updates via WebSocket
    useEffect(() => {
        if (!intentId || !socket) return;

        console.log(`[usePaymentIntent] Subscribing to intent: ${intentId}`);

        // Subscribe to this intent
        socket.emit('subscribe', { intentId });

        // Listen for status changes
        const handleStatusChange = (data: any) => {
            console.log('[usePaymentIntent] Status changed:', data);

            // Check if this update is for the current intent
            if (data.intentId === intentId || data.id === intentId) {
                const updatedIntent = data.intent || data;
                setIntent(updatedIntent);

                // Show user-friendly notifications
                const status = data.toStatus || updatedIntent.status;
                switch (status) {
                    case PaymentIntentStatus.PENDING_CONFIRMATION:
                        toast.info('Transaction broadcasted, waiting for confirmation...');
                        break;
                    case PaymentIntentStatus.CONFIRMED:
                        toast.success('Payment confirmed!');
                        break;
                    case PaymentIntentStatus.FAILED:
                        toast.error(`Payment failed: ${updatedIntent.errorMessage || 'Unknown error'}`);
                        break;
                }
            }
        };

        const handleIntentUpdated = (data: any) => {
            console.log('[usePaymentIntent] Intent updated:', data);

            // Check if this update is for the current intent
            if (data.id === intentId) {
                setIntent(data);
            }
        };

        socket.on('status.changed', handleStatusChange);
        socket.on('intent.updated', handleIntentUpdated);

        // Cleanup
        return () => {
            console.log(`[usePaymentIntent] Unsubscribing from intent: ${intentId}`);
            socket.emit('unsubscribe', { intentId });
            socket.off('status.changed', handleStatusChange);
            socket.off('intent.updated', handleIntentUpdated);
        };
    }, [intentId, socket]);

    // Fetch initial data
    // useEffect(() => {
    //     if (intentId) {
    //         fetchIntent(intentId);
    //     }
    // }, [intentId, fetchIntent]);

    return {
        intent,
        loading,
        error,
        createIntent,
        submitTransaction,
        cancelIntent,
        refreshIntent: () => intentId && fetchIntent(intentId),
    };
};