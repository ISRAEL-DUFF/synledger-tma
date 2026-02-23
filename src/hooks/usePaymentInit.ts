import { useState } from 'react';
import { api } from '@/lib/api';

interface InitiatePaymentIntentParams {
    accountNumber: string;
    accountBank: string;
    amount: number;
    narration?: string;
    category?: string;
    token?: string;
    chain?: string;
}

interface InitiatePaymentIntentResponse {
    success: boolean;
    reference: string;
    amount: number;
    message: string;
}

export function usePaymentInit() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reference, setReference] = useState<string>("");

    const initPayment = async ({ accountNumber, accountBank, amount, narration, category, token, chain }: InitiatePaymentIntentParams) => {
        setLoading(true);
        setError(null);
        setReference("");

        try {
            const response = await api.post<InitiatePaymentIntentResponse>('/payments/initiate-payment-intent', {
                accountNumber,
                accountBank,
                amount,
                narration,
                category,
                token,
                chain,
            });

            if (response.success) {
                setReference(response.reference);
                return response;
            } else {
                setError("Could not resolve account details");
            }
        } catch (err: any) {
            console.error("Verification error:", err);
            const msg = err.message || "Failed to verify account";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const confirmPayment = async ({ reference, onchainEscrowId, txHash }: { reference: string, onchainEscrowId: string, txHash: string }) => {
        setLoading(true);
        setError(null);

        console.log("Confirm:", { reference, onchainEscrowId, txHash });

        try {
            const response = await api.post<InitiatePaymentIntentResponse>('/payments/confirm-payment-intent', {
                reference,
                onchainEscrowId,
                txHash,
            });

            if (response.success) {
                return response;
            } else {
                setError("Could not confirm payment");
            }
        } catch (err: any) {
            console.error("Verification error:", err);
            const msg = err.message || "Failed to confirm payment";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const clearPaymentInit = () => {
        setReference("");
        setError(null);
        setLoading(false);
    };

    return { initPayment, reference, loading, error, confirmPayment, clearPaymentInit };
}
