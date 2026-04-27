/**
 * useSocket.js – Custom React hook for Socket.io connection management
 * 
 * Manages a single Socket.io connection to the backend server,
 * handles reconnection, and provides event subscription utilities.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [topology, setTopology] = useState({ nodes: [], edges: [] });
  const [emergencies, setEmergencies] = useState([]);
  const [propagationSteps, setPropagationSteps] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
  const [currentPropagation, setCurrentPropagation] = useState(null);

  useEffect(() => {
    // Create socket connection
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnected(false);
    });

    // Receive initial topology
    socket.on('topology', (data) => {
      setTopology(data);
    });

    // Receive initial emergencies
    socket.on('initial-emergencies', (data) => {
      setEmergencies(data.emergencies || []);
    });

    // Real-time propagation steps for visualization
    socket.on('propagation-step', (data) => {
      setCurrentPropagation(data);
      setPropagationSteps(prev => [...prev, data]);
      // Update topology with new node states
      if (data.nodes) {
        setTopology(prev => ({ ...prev, nodes: data.nodes }));
      }
    });

    // Propagation complete
    socket.on('propagation-complete', (data) => {
      if (data.nodes) {
        setTopology(prev => ({ ...prev, nodes: data.nodes }));
      }
      // Reset propagation after a delay
      setTimeout(() => {
        setCurrentPropagation(null);
      }, 2000);
    });

    // New emergency alert (legacy)
    socket.on('emergency-alert', (data) => {
      setEmergencies(prev => {
        const exists = prev.find(e => e.id === data.emergency.id);
        if (exists) {
          return prev.map(e => e.id === data.emergency.id ? data.emergency : e);
        }
        return [data.emergency, ...prev];
      });

      // Add notification
      if (data.isNew) {
        const notif = {
          id: Date.now(),
          type: data.emergency.type,
          priority: data.emergency.priority,
          message: `${data.emergency.type.toUpperCase()} emergency detected!`,
          timestamp: new Date().toISOString(),
        };
        setNotifications(prev => [notif, ...prev].slice(0, 5));
      }
    });

    // REAL-TIME emergency update from Socket.io (NEW)
    socket.on('emergency_update', (data) => {
      console.log('🚨 [emergency_update] Received:', data.emergency.type);
      
      // Add or update emergency
      setEmergencies(prev => {
        const exists = prev.find(e => e.id === data.emergency.id);
        if (exists) {
          return prev.map(e => e.id === data.emergency.id ? data.emergency : e);
        }
        // Add new emergency on top (LIFO)
        return [data.emergency, ...prev];
      });

      // Add notification for new emergency
      if (data.isNew) {
        const notif = {
          id: Date.now(),
          type: data.emergency.type,
          priority: data.emergency.priority || 'CRITICAL',
          message: `🚨 ${data.emergency.type.toUpperCase()} Emergency Detected! [${data.hopsReached} nodes reached]`,
          timestamp: data.timestamp || new Date().toISOString(),
          hopsReached: data.hopsReached || 0,
          activeNodes: data.activeNodes || [],
        };
        setNotifications(prev => [notif, ...prev].slice(0, 8));
      }

      // Update topology with active nodes if available
      if (data.activeNodes && data.activeNodes.length > 0) {
        setTopology(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => 
            data.activeNodes.includes(n.id) 
              ? { ...n, status: 'alerting' } 
              : n
          ),
        }));
      }

      console.log('📡 Hops reached:', data.hopsReached, 'Active nodes:', data.activeNodes?.length || 0);
    });

    // Emergency resolved
    socket.on('emergency-resolved', (data) => {
      setEmergencies(prev =>
        prev.map(e => e.id === data.emergency.id ? data.emergency : e)
      );
    });

    // Gateway sync notification
    socket.on('gateway-sync', (data) => {
      const notif = {
        id: Date.now(),
        type: 'gateway',
        priority: 'info',
        message: `Gateway ${data.nodeName} synced to backend`,
        timestamp: new Date().toISOString(),
      };
      setNotifications(prev => [notif, ...prev].slice(0, 5));
    });

    // ACK events
    socket.on('ack-received', (data) => {
      // Could be used for visual feedback
    });

    // Stats update
    socket.on('stats-update', (data) => {
      setStats(data);
    });

    // Error messages
    socket.on('error-message', (data) => {
      const notif = {
        id: Date.now(),
        type: 'error',
        priority: 'high',
        message: data.message,
        timestamp: new Date().toISOString(),
      };
      setNotifications(prev => [notif, ...prev].slice(0, 5));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  /** Trigger an SOS emergency */
  const triggerSOS = useCallback((data) => {
    if (socketRef.current) {
      setPropagationSteps([]);
      socketRef.current.emit('trigger-sos', data);
    }
  }, []);

  /** Resolve an emergency */
  const resolveEmergency = useCallback((id) => {
    if (socketRef.current) {
      socketRef.current.emit('resolve-emergency', { id });
    }
  }, []);

  /** Reset node states */
  const resetNodes = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('reset-nodes');
      setPropagationSteps([]);
      setCurrentPropagation(null);
    }
  }, []);

  /** Remove a notification */
  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    connected,
    topology,
    emergencies,
    propagationSteps,
    currentPropagation,
    notifications,
    stats,
    triggerSOS,
    resolveEmergency,
    resetNodes,
    dismissNotification,
  };
}
