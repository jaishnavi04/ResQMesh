/**
 * useSocket.js – Admin Dashboard Socket.io hook
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
  const [currentPropagation, setCurrentPropagation] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('topology', (data) => setTopology(data));
    socket.on('initial-emergencies', (data) => setEmergencies(data.emergencies || []));

    socket.on('propagation-step', (data) => {
      setCurrentPropagation(data);
      setPropagationSteps(prev => [...prev, data]);
      if (data.nodes) setTopology(prev => ({ ...prev, nodes: data.nodes }));
    });

    socket.on('propagation-complete', (data) => {
      if (data.nodes) setTopology(prev => ({ ...prev, nodes: data.nodes }));
      setTimeout(() => setCurrentPropagation(null), 2000);
    });

    socket.on('emergency-alert', (data) => {
      setEmergencies(prev => {
        const exists = prev.find(e => e.id === data.emergency.id);
        if (exists) return prev.map(e => e.id === data.emergency.id ? data.emergency : e);
        return [data.emergency, ...prev];
      });
    });

    socket.on('emergency-resolved', (data) => {
      setEmergencies(prev => prev.map(e => e.id === data.emergency.id ? data.emergency : e));
    });

    socket.on('stats-update', (data) => setStats(data));

    return () => socket.disconnect();
  }, []);

  const resolveEmergency = useCallback((id) => {
    socketRef.current?.emit('resolve-emergency', { id });
  }, []);

  const resetNodes = useCallback(() => {
    socketRef.current?.emit('reset-nodes');
    setPropagationSteps([]);
    setCurrentPropagation(null);
  }, []);

  return { connected, topology, emergencies, propagationSteps, currentPropagation, stats, resolveEmergency, resetNodes };
}
