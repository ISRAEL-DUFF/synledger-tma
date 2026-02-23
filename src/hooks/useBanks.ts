import { useState, useEffect } from 'react';
import axios from 'axios';

export interface Bank {
    id: number;
    code: string;
    name: string;
    logo?: string;
}

interface BankListResponse {
    success: boolean;
    banks: Bank[];
}

// Default to localhost if VITE_API_URL is not set
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'; // 'https://synledger.name.ng';

export function useBanks() {
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                setLoading(true);
                const response = await axios.get<BankListResponse>(`${API_URL}/payments/banks`);
                if (response.data.success) {
                    // Sort banks alphabetically by name
                    const sortedBanks = response.data.banks.sort((a, b) =>
                        a.name.localeCompare(b.name)
                    );
                    setBanks(sortedBanks);
                } else {
                    setError('Failed to fetch banks');
                }
            } catch (err) {
                console.error('Error fetching banks:', err);
                setError('An error occurred while fetching banks');
            } finally {
                setLoading(false);
            }
        };

        fetchBanks();
    }, []);

    return { banks, loading, error };
}
