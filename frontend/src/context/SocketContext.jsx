import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { requestAPI, matchAPI } from '../services/api';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [stompClient, setStompClient] = useState(null);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [activeMatch, setActiveMatch] = useState(null);
  const [activeMatchNotification, setActiveMatchNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const clientRef = useRef(null);

  // Check for existing pending requests and active match on load
  useEffect(() => {
    if (user && token) {
      requestAPI.getIncoming().then((res) => {
        if (res.data && res.data.length > 0) {
          setIncomingRequest(res.data[0]);
        }
      }).catch(err => console.log('Check incoming requests:', err));

      matchAPI.getActive().then((res) => {
        if (res.data && res.data.id) {
          setActiveMatch(res.data);
        } else {
          setActiveMatch(null);
        }
      }).catch(err => console.log('Check active match:', err));
    }
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
        setStompClient(null);
      }
      setActiveMatch(null);
      setIncomingRequest(null);
      return;
    }

    // Initialize STOMP client over SockJS
    const socket = new SockJS('/ws-ridelink');
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        // console.log('STOMP: ' + str);
      },
      onConnect: () => {
        console.log('Connected to RideLink WebSocket');

        // Subscribe to incoming ride requests
        client.subscribe(`/topic/user/${user.id}/requests`, (message) => {
          try {
            const data = JSON.parse(message.body);
            if (data.status === 'PENDING') {
              setIncomingRequest(data);
              setUnreadCount((c) => c + 1);
            }
          } catch (e) {
            console.error('Failed to parse incoming request message', e);
          }
        });

        // Subscribe to match notifications (e.g. accepted ride request)
        client.subscribe(`/topic/user/${user.id}/matches`, (message) => {
          try {
            const data = JSON.parse(message.body);
            if (data.type === 'MATCH_ACCEPTED') {
              setActiveMatch(data.match);
              setActiveMatchNotification(data.match);
            } else if (data.type === 'MATCH_COMPLETED' || data.type === 'MATCH_CANCELLED') {
              setActiveMatch(null);
            }
          } catch (e) {
            console.error('Failed to parse match message', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;
    setStompClient(client);

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [user?.id, token]);

  const clearIncomingRequest = () => {
    setIncomingRequest(null);
  };

  const clearMatchNotification = () => {
    setActiveMatchNotification(null);
  };

  const refreshActiveMatch = async () => {
    try {
      const res = await matchAPI.getActive();
      if (res.data && res.data.id) {
        setActiveMatch(res.data);
      } else {
        setActiveMatch(null);
      }
    } catch (e) {
      setActiveMatch(null);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        stompClient,
        incomingRequest,
        setIncomingRequest,
        clearIncomingRequest,
        activeMatch,
        setActiveMatch,
        refreshActiveMatch,
        activeMatchNotification,
        clearMatchNotification,
        unreadCount,
        setUnreadCount,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
