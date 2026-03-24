"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/utils/api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const hostname = window.location.hostname;
      const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || (hostname !== 'localhost' && !hostname.includes('127.0.0.1') ? `http://${hostname}:5000` : 'http://localhost:5000');
      const newSocket = io(socketUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket Connected:', newSocket.id);
        // Join a room specific to the user role and ID
        newSocket.emit('join', { userId: user._id, role: user.role });
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket Disconnected');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      setSocket(null);
      setIsConnected(false);
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
