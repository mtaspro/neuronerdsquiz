import { io } from 'socket.io-client';
import getEnvironmentConfig from '../config/environment.js';

// Socket Manager - Singleton pattern to prevent multiple connections
class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnecting = false;
    this.eventListeners = new Map();
    this.connectionPromise = null;
  }

  // Get socket configuration
  getSocketConfig() {
    // Get environment configuration
    const envConfig = getEnvironmentConfig();
    const socketUrl = envConfig.socketUrl;

    // Log configuration for debugging
    console.log('🔧 Socket Config:', {
      ...envConfig,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
      origin: typeof window !== 'undefined' ? window.location.origin : 'server',
      finalUrl: socketUrl
    });

    // Validate URL
    if (!socketUrl || socketUrl === 'undefined') {
      console.error('❌ Socket URL is undefined or empty!');
      throw new Error('Socket server URL is not configured properly');
    }

    const isSecure = socketUrl.startsWith('https://');

    return {
      url: socketUrl,
      options: {
        // Connection settings
        autoConnect: false, // Manual connection control
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 15000, // Increased timeout for production
        
        // Transport settings - try polling first in production for better compatibility
        transports: isSecure ? ['polling', 'websocket'] : ['websocket', 'polling'],
        upgrade: true,
        
        // CORS and security
        withCredentials: false,
        forceNew: false,
        
        // Additional options for stability
        pingTimeout: 60000,
        pingInterval: 25000,
        
        // Production-specific options
        ...(isSecure && {
          secure: true, // Force HTTPS in production
          rejectUnauthorized: false // Allow self-signed certificates if needed
        })
      }
    };
  }

  // Connect to socket server
  async connect() {
    // Return existing connection if already connected
    if (this.socket && this.socket.connected) {
      console.log('🔄 Using existing socket connection');
      return this.socket;
    }

    // Return existing connection promise if already connecting
    if (this.isConnecting && this.connectionPromise) {
      console.log('⏳ Connection already in progress, waiting...');
      return this.connectionPromise;
    }

    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const config = this.getSocketConfig();
        
        console.log('🔌 Connecting to Socket.IO server:', config.url);
        
        // Create new socket instance
        this.socket = io(config.url, config.options);

        // Set up core event handlers
        this.socket.on('connect', () => {
          console.log('✅ Connected to Socket.IO server');
          console.log('🆔 Socket ID:', this.socket.id);
          console.log('🚀 Transport:', this.socket.io.engine.transport.name);
          
          // Attach all queued event listeners
          this.attachQueuedListeners();
          
          this.isConnecting = false;
          resolve(this.socket);
        });

        this.socket.on('connect_error', (error) => {
          console.error('🔥 Socket connection error:', error);
          console.error('🌐 Attempted URL:', config.url);
          console.error('⚙️ Error details:', {
            message: error.message,
            description: error.description,
            context: error.context,
            type: error.type
          });
          this.isConnecting = false;
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('❌ Disconnected from Socket.IO server:', reason);
          
          // Only log as error if it's an unexpected disconnection
          if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
            console.error('🚨 Unexpected disconnection:', reason);
          }
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Reconnected to Socket.IO server (attempt:', attemptNumber, ')');
        });

        this.socket.on('reconnect_error', (error) => {
          console.error('🔄❌ Reconnection failed:', error);
        });

        this.socket.on('reconnect_failed', () => {
          console.error('🔄💀 Reconnection failed permanently');
        });

        // Manually connect
        this.socket.connect();

        // Set timeout for connection
        setTimeout(() => {
          if (this.isConnecting) {
            console.error('⏰ Connection timeout');
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 15000);

      } catch (error) {
        console.error('💥 Error creating socket:', error);
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // Get current socket instance
  getSocket() {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket not connected, attempting to connect...');
      return this.connect();
    }
    return Promise.resolve(this.socket);
  }

  // Add event listener with automatic cleanup tracking
  addEventListener(event, handler, componentId = 'default') {
    if (!this.eventListeners.has(componentId)) {
      this.eventListeners.set(componentId, new Map());
    }
    
    const componentListeners = this.eventListeners.get(componentId);
    
    // Remove existing listener for this event if it exists
    if (componentListeners.has(event)) {
      this.removeEventListener(event, componentId);
    }
    
    componentListeners.set(event, handler);
    
    // Add listener to socket immediately if socket exists, or queue it for when socket connects
    if (this.socket) {
      this.socket.on(event, handler);
      console.log(`📡 Added listener for '${event}' (component: ${componentId})`);
    } else {
      console.log(`📋 Queued listener for '${event}' (component: ${componentId}) - will add when socket connects`);
    }
  }

  // Remove event listener
  removeEventListener(event, componentId = 'default') {
    const componentListeners = this.eventListeners.get(componentId);
    if (componentListeners && componentListeners.has(event)) {
      const handler = componentListeners.get(event);
      if (this.socket) {
        this.socket.off(event, handler);
      }
      componentListeners.delete(event);
    }
  }

  // Remove all event listeners for a component
  removeAllEventListeners(componentId = 'default') {
    const componentListeners = this.eventListeners.get(componentId);
    if (componentListeners) {
      for (const [event, handler] of componentListeners) {
        if (this.socket) {
          this.socket.off(event, handler);
        }
      }
      componentListeners.clear();
      this.eventListeners.delete(componentId);
    }
  }

  // Attach all queued event listeners to the socket
  attachQueuedListeners() {
    if (!this.socket) return;
    
    console.log('🔗 Attaching queued event listeners...');
    let listenerCount = 0;
    
    for (const [componentId, componentListeners] of this.eventListeners) {
      for (const [event, handler] of componentListeners) {
        this.socket.on(event, handler);
        listenerCount++;
        console.log(`📡 Attached listener for '${event}' (component: ${componentId})`);
      }
    }
    
    console.log(`✅ Attached ${listenerCount} queued event listeners`);
  }

  // Emit event
  async emit(event, data) {
    try {
      const socket = await this.getSocket();
      console.log(`📤 Emitting event '${event}' with data:`, data);
      socket.emit(event, data);
    } catch (error) {
      console.error('❌ Failed to emit event:', event, error);
      throw error;
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      console.log('🔌❌ Disconnecting socket...');
      
      // Remove all event listeners
      for (const componentId of this.eventListeners.keys()) {
        this.removeAllEventListeners(componentId);
      }
      
      // Disconnect socket
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  // Get connection info for debugging
  getConnectionInfo() {
    const config = this.getSocketConfig();
    return {
      url: config.url,
      connected: this.socket?.connected || false,
      connecting: this.isConnecting,
      socketId: this.socket?.id || null,
      transport: this.socket?.io?.engine?.transport?.name || null,
      environment: import.meta.env.MODE,
      eventListeners: Array.from(this.eventListeners.keys()),
      config: config.options
    };
  }
}

// Create singleton instance
const socketManager = new SocketManager();

// Battle room helper functions
export const battleSocketHelpers = {
  // Join a battle room
  joinRoom: async (roomId, userId, username) => {
    await socketManager.emit('joinBattleRoom', {
      roomId,
      userId,
      username
    });
  },
  
  // Leave a battle room
  leaveRoom: async (roomId, userId) => {
    await socketManager.emit('leaveRoom', {
      roomId,
      userId
    });
  },
  
  // Set ready status
  setReady: async (roomId, userId, isReady) => {
    await socketManager.emit('setReady', {
      roomId,
      userId,
      isReady
    });
  },
  
  // Start battle
  startBattle: async (roomId, questions, creatorUserId) => {
    await socketManager.emit('startBattle', {
      roomId,
      questions,
      creatorUserId
    });
  },
  
  // Submit answer
  submitAnswer: async (roomId, userId, questionIndex, answer, isCorrect, timeSpent) => {
    await socketManager.emit('answerQuestion', {
      roomId,
      userId,
      questionIndex,
      answer,
      isCorrect,
      timeSpent
    });
  }
};

// Hook for using socket in React components
export const useSocket = (componentId = 'default') => {
  const connect = () => socketManager.connect();
  
  const addListener = (event, handler) => {
    socketManager.addEventListener(event, handler, componentId);
  };
  
  const removeListener = (event) => {
    socketManager.removeEventListener(event, componentId);
  };
  
  const removeAllListeners = () => {
    socketManager.removeAllEventListeners(componentId);
  };
  
  const emit = (event, data) => socketManager.emit(event, data);
  
  const getConnectionInfo = () => socketManager.getConnectionInfo();
  
  return {
    connect,
    addListener,
    removeListener,
    removeAllListeners,
    emit,
    getConnectionInfo,
    battleHelpers: battleSocketHelpers
  };
};

// Export singleton instance and helpers
export { socketManager };
export default socketManager;