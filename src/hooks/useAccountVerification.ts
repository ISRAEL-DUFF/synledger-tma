import { useState } from 'react';
import axios from 'axios';

interface ResolveAccountParams {
    accountNumber: string;
    accountBank: string;
}

interface ResolveAccountResponse {
    success: boolean;
    accountNumber: string;
    accountName: string;
    bankCode: string;
}

// Default to localhost:4000 if VITE_API_URL is not set, matching useBanks.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'; // 'https://synledger.name.ng';

export function useAccountVerification() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [accountName, setAccountName] = useState<string>("");

    const verifyAccount = async ({ accountNumber, accountBank }: ResolveAccountParams) => {
        setLoading(true);
        setError(null);
        setAccountName("");

        try {
            const response = await axios.post<ResolveAccountResponse>(`${API_URL}/payments/resolve-account`, {
                accountNumber,
                accountBank,
            });

            if (response.data.success) {
                setAccountName(response.data.accountName);
                return response.data;
            } else {
                setError("Could not resolve account details");
            }

            // console.log("Calling...", {
            //     accountNumber,
            //     accountBank
            // })
            // setAccountName("John Doe");
            // return {
            //     success: true,
            //     accountNumber,
            //     accountName,
            //     bankCode: "000000"
            // }
        } catch (err: any) {
            console.error("Verification error:", err);
            const msg = err.response?.data?.message || "Failed to verify account";
            setError(msg);
        } finally {
            console.log("Finally called...")
            setLoading(false);
        }
    };

    const clearVerification = () => {
        setAccountName("");
        setError(null);
        setLoading(false);
    };

    return { verifyAccount, accountName, loading, error, clearVerification };
}
