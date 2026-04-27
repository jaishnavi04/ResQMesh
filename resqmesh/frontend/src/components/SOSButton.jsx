/**
 * SOSButton.jsx – Premium Emergency SOS Trigger Component
 * 
 * Features:
 * - Multiple pulse animations
 * - Real-time status feedback
 * - Optional sound effects
 * - Smooth micro-interactions
 * - Emergency type selector with gradient backgrounds
 */

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { emitEmergency } from '../socket';

/** Emergency type configurations */
const EMERGENCY_TYPES = [
  { id: 'fire', label: '🔥 Fire', color: 'active-fire' },
  { id: 'medical', label: '🏥 Medical', color: 'active-medical' },
  { id: 'security', label: '🔒 Security', color: 'active-security' },
];

/** Available origin nodes for simulation */
const ORIGIN_NODES = [
  { id: 'node-1', label: 'Node 1 – Alpha' },
  { id: 'node-2', label: 'Node 2 – Bravo' },
  { id: 'node-4', label: 'Node 4 – Delta' },
  { id: 'node-5', label: 'Node 5 – Echo' },
  { id: 'node-8', label: 'Node 8 – Hotel' },
];

/**
 * Play subtle alert sound (Web Audio API)
 * Creates a sine wave beep with fade-out
 */
const playAlertSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (err) {
    console.log('Audio not available:', err);
  }
};

export default function SOSButton({ isPropagating }) {
  const [selectedType, setSelectedType] = useState('fire');
  const [selectedNode, setSelectedNode] = useState('node-1');
  const [triggered, setTriggered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const sosButtonRef = useRef(null);

  /**
   * Create ripple effect on click
   */
  const createRipple = (event) => {
    const button = sosButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');

    ripple.className = 'ripple-effect';
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 1000);
  };

  const handleSOS = (event) => {
    // Prevent multiple triggers
    if (isPropagating || triggered || isLoading) return;

    // Create ripple effect
    createRipple(event);

    setIsLoading(true);
    setTriggered(true);

    // Play alert sound
    playAlertSound();

    // Mock GPS location (Delhi area)
    const location = {
      lat: 28.6139 + (Math.random() - 0.5) * 0.05,
      lng: 77.2090 + (Math.random() - 0.5) * 0.05,
    };

    // Create emergency object with required fields
    const emergencyData = {
      id: Date.now().toString(),
      type: selectedType,
      origin: selectedNode,
      location,
      priority: selectedType === 'fire' ? 'CRITICAL' : 'HIGH',
      hops: 0,
      timestamp: new Date().toISOString(),
      message: `${selectedType.toUpperCase()} emergency at ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
    };

    // Emit via Socket.io
    try {
      emitEmergency(emergencyData);

      // Toast notification with rich content
      const icons = { fire: '🔥', medical: '🏥', security: '🔒' };
      toast.success(
        (t) => (
          <div className="flex flex-col gap-2 w-full">
            <p className="font-bold text-lg flex items-center gap-2">
              {icons[selectedType]} {selectedType.toUpperCase()} Emergency
            </p>
            <p className="text-sm text-slate-300">📍 {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°</p>
            <p className="text-sm text-slate-300">📡 Origin: {selectedNode}</p>
            <p className="text-xs text-slate-400 mt-1">Broadcasting through mesh network...</p>
          </div>
        ),
        {
          duration: 5000,
          style: {
            background: '#0f172a',
            color: '#fff',
            border: '2px solid #ef4444',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 20px 40px rgba(239, 68, 68, 0.3)',
          },
        }
      );

      console.log('✅ Emergency emitted successfully:', emergencyData.id);
    } catch (err) {
      console.error('❌ Failed to emit emergency:', err);
      toast.error('Failed to broadcast emergency. Check connection.', {
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }

    // Reset triggered animation after delay
    setTimeout(() => setTriggered(false), 3000);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-6 animate-fade-in">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Emergency SOS
        </h2>
        <p className="text-slate-400 text-sm font-medium">
          Select emergency type and trigger mesh broadcast
        </p>
      </div>

      {/* Emergency Type Selector – Premium Grid */}
      <div className="flex gap-3 flex-wrap justify-center max-w-md">
        {EMERGENCY_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`type-btn ${selectedType === type.id ? type.color : ''}`}
            disabled={isPropagating || isLoading}
            title={`Select ${type.label} as emergency type`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Origin Node Selector – Premium Dropdown */}
      <div className="w-full max-w-xs">
        <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest letter-spacing">
          🎯 Origin Node
        </label>
        <select
          value={selectedNode}
          onChange={e => setSelectedNode(e.target.value)}
          className="w-full px-4 py-3 rounded-12px bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-600/30 text-slate-200 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isPropagating || isLoading}
        >
          {ORIGIN_NODES.map(node => (
            <option key={node.id} value={node.id}>
              {node.label}
            </option>
          ))}
        </select>
      </div>

      {/* SOS Button with multiple pulse rings and ripple effect */}
      <div className="relative mt-6">
        {/* Animated background glow */}
        <div className="absolute inset-0 m-auto w-[220px] h-[220px] rounded-full bg-gradient-to-br from-red-600/20 to-red-900/10 blur-2xl animate-pulse" />

        {/* Ripple animation rings on trigger */}
        {triggered && (
          <>
            <div className="absolute inset-0 m-auto w-[180px] h-[180px] rounded-full ripple-effect" />
            <div className="absolute inset-0 m-auto w-[180px] h-[180px] rounded-full ripple-effect" style={{ animationDelay: '0.3s' }} />
            <div className="absolute inset-0 m-auto w-[180px] h-[180px] rounded-full ripple-effect" style={{ animationDelay: '0.6s' }} />
          </>
        )}

        {/* Main SOS Button */}
        <button
          ref={sosButtonRef}
          onClick={handleSOS}
          disabled={isPropagating || isLoading || triggered}
          className={`relative sos-button w-[180px] h-[180px] z-10 ${
            isPropagating || isLoading || triggered ? 'disabled' : ''
          }`}
          id="sos-trigger-btn"
          title={isPropagating ? 'Propagation in progress...' : 'Click to broadcast emergency'}
        >
          {isLoading ? (
            <div className="animate-spin">⚙️</div>
          ) : (
            'SOS'
          )}
        </button>
      </div>

      {/* Status Indicator – Real-time Feedback */}
      <div className="text-center min-h-[48px] flex flex-col justify-center">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm font-medium text-blue-400">
              Sending emergency...
            </span>
          </div>
        ) : isPropagating ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-medium text-amber-400">
              Propagating through mesh network...
            </span>
          </div>
        ) : (
          <p className="text-slate-500 text-xs leading-relaxed">
            Press SOS to broadcast emergency signal across mesh network
          </p>
        )}
      </div>

      {/* GPS Information Card – Premium Design */}
      <div className="glass-card glass-card-hover px-4 py-3 text-xs text-slate-400 flex items-center gap-3 max-w-sm">
        <span className="text-lg flex-shrink-0">📍</span>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Mock Location</p>
          <p className="text-slate-300 font-mono">28.6139°N, 77.2090°E • Delhi</p>
          <p className="text-[10px] text-slate-500 mt-1">GPS data simulated for demo</p>
        </div>
      </div>
    </div>
  );
}
