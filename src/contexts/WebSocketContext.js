import React, { createContext, useContext, useCallback, useState, useMemo } from 'react';

// Create a mock WebSocket context that doesn't actually connect to a server
const WebSocketContext = createContext(null);

// Mock WebSocket provider that simulates WebSocket behavior
export const WebSocketProvider = ({ children }) => {
  const [isConnected] = useState(true); // Always report as connected
  const [seatUpdates] = useState({});
  const eventHandlers = useMemo(() => new Map(), []); // Memoize the Map to prevent recreation

  // Subscribe to events
  const subscribe = useCallback((eventType, handler) => {
    if (!eventHandlers.has(eventType)) {
      eventHandlers.set(eventType, new Set());
    }
    
    const handlers = eventHandlers.get(eventType);
    handlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      if (eventHandlers.has(eventType)) {
        eventHandlers.get(eventType).delete(handler);
      }
    };
  }, [eventHandlers]);

  // Mock sending a message
  const sendMessage = useCallback((message) => {
    //console.log('WebSocket: Mock message sent:', message);
    // Simulate a response for certain message types
    if (message.type === 'SUBSCRIBE_SEATS') {
      // Simulate a seat update after a short delay
      setTimeout(() => {
        const mockUpdate = {
          type: 'SEAT_UPDATE',
          busNumber: message.busNumber,
          seats: {}
        };
        
        const handlers = eventHandlers.get('SEAT_UPDATE') || [];
        handlers.forEach(handler => handler(mockUpdate));
      }, 100);
    }
    return true;
  }, [eventHandlers]);

  // Mock getting seat updates
  const getSeatUpdates = useCallback((busNumber) => {
    return seatUpdates[busNumber] || {};
  }, [seatUpdates]);

  // Mock subscribe to seat updates
  const subscribeToSeatUpdates = useCallback((busNumber, callback) => {
    // Simulate subscribing to seat updates
    return subscribe('SEAT_UPDATE', (data) => {
      if (data.busNumber === busNumber) {
        callback(data.seats || {});
      }
    });
  }, [subscribe]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        subscribe,
        sendMessage,
        subscribeToSeatUpdates,
        getSeatUpdates
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook to use the WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    console.warn('useWebSocket must be used within a WebSocketProvider');
    // Return a mock implementation if used outside provider
    return {
      isConnected: false,
      subscribe: () => () => {},
      sendMessage: () => false,
      subscribeToSeatUpdates: () => () => {},
      getSeatUpdates: () => ({}),
    };
  }
  return context;
};
