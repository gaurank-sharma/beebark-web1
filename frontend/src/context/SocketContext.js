import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { token, user } = useAuth();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

  // Keep the latest user id available to the (long-lived) connect handler
  const userIdRef = useRef(null);
  userIdRef.current = user?.id || null;

  useEffect(() => {
    if (!token) {
      setSocket((prev) => {
        if (prev) prev.close();
        return null;
      });
      return undefined;
    }

    const newSocket = io(BACKEND_URL, {
      auth: { token },
      // Allow websocket but fall back to long-polling (works behind proxies /
      // hosts where raw websockets are flaky)
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true
    });

    // Re-register presence on every (re)connect so the server's socket map
    // stays correct after drops/reconnects — fixes messages silently not
    // arriving after a reconnect.
    const registerPresence = () => {
      if (userIdRef.current) newSocket.emit('user-connected', userIdRef.current);
    };

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      registerPresence();
    });
    newSocket.io.on('reconnect', registerPresence);
    newSocket.on('connect_error', (err) => console.warn('Socket connect error:', err.message));

    setSocket(newSocket);

    return () => {
      newSocket.off('connect');
      newSocket.io.off('reconnect');
      newSocket.close();
    };
  }, [token, BACKEND_URL]);

  // If the user object loads after the socket connects, register presence then
  useEffect(() => {
    if (socket && socket.connected && user?.id) {
      socket.emit('user-connected', user.id);
    }
  }, [socket, user?.id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
