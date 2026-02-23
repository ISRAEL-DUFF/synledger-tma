export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface RequestOptions extends RequestInit {
    token?: string;
    data?: any;
}

class ApiError extends Error {
    status: number;
    data: any;

    constructor(status: number, message: string, data?: any) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = options.token || localStorage.getItem('synledger_token') || undefined;
    const { data, ...customConfig } = options;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...customConfig,
        headers: {
            ...headers,
            ...customConfig.headers,
        },
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    // Ensure endpoint starts with /
    const url = `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const response = await fetch(url, config);
    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new ApiError(response.status, responseData.message || 'Something went wrong', responseData);
    }

    return responseData as T;
}

export const api = {
    get: <T>(endpoint: string, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: 'GET' }),

    post: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, data, method: 'POST' }),

    put: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, data, method: 'PUT' }),

    delete: <T>(endpoint: string, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: 'DELETE' }),
};
