// hooks/useSocket.ts
// React hook for managing WebSocket connection

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';


const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

let globalSocket: Socket | null = null;

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const { token } = useAuth();

    useEffect(() => {
        // Use existing socket if available
        if (globalSocket) {
            setSocket(globalSocket);
            setConnected(globalSocket.connected);
            return;
        }

        // Create new socket connection
        // We use the standard /socket.io/ path which is default
        const newSocket = io(`${WS_URL}/payment-intents`, {
            transports: ['websocket'],
            autoConnect: true,
            // path: '/socket.io/', // Default, but can be explicit if needed
        });

        socketRef.current = newSocket;
        globalSocket = newSocket;

        newSocket.on('connect', () => {
            console.log('WebSocket connected');
            setConnected(true);

            // Authenticate with JWT token
            newSocket.emit('authenticate', { token }, (response: any) => {
                if (response.success) {
                    console.log('Authenticated successfully:', response.userId);
                } else {
                    console.error('Authentication failed:', response.message);
                    newSocket.disconnect();
                }
            });
        });

        newSocket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            setConnected(false);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            // Don't disconnect on component unmount - keep connection alive
            // Only disconnect when app closes
        };
    }, [token]);

    return socket;
};

// Hook to manage connection lifecycle
export const useSocketConnection = () => {
    const socket = useSocket();
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => setConnected(true);
        const handleDisconnect = () => setConnected(false);

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        setConnected(socket.connected);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, [socket]);

    return { socket, connected };
};