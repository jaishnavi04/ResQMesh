/**
 * NotificationPopup.jsx – Premium Toast Notification System
 * 
 * Displays real-time alert notifications with:
 * - Priority-based color coding
 * - Auto-dismiss with smooth animations
 * - Emergency type icons with glow effects
 * - Real-time timestamp updates
 */

import { useEffect, useState } from 'react';

const TYPE_CONFIG = {
  fire: {
    icon: '🔥',
    color: 'from-red-500/20 to-red-600/10',
    border: 'border-red-500/50',
    accent: 'text-red-300',
    glow: 'shadow-red-500/20'
  },
  medical: {
    icon: '🏥',
    color: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/50',
    accent: 'text-blue-300',
    glow: 'shadow-blue-500/20'
  },
  security: {
    icon: '🔒',
    color: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/50',
    accent: 'text-amber-300',
    glow: 'shadow-amber-500/20'
  },
  gateway: {
    icon: '🌉',
    color: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/50',
    accent: 'text-emerald-300',
    glow: 'shadow-emerald-500/20'
  },
  error: {
    icon: '⚠️',
    color: 'from-orange-500/20 to-orange-600/10',
    border: 'border-orange-500/50',
    accent: 'text-orange-300',
    glow: 'shadow-orange-500/20'
  },
};

const PRIORITY_DURATION = {
  critical: 8000,
  high: 6000,
  medium: 4000,
  info: 3000,
};

export default function NotificationPopup({ notifications, onDismiss }) {
  return (
    <div className="fixed top-24 right-4 z-40 flex flex-col gap-3 max-w-sm pointer-events-none">
      {notifications.map(notif => (
        <NotificationItem
          key={notif.id}
          notification={notif}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

function NotificationItem({ notification, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.error;
  const duration = PRIORITY_DURATION[notification.priority] || 4000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(notification.id), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [notification.id, duration, onDismiss]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const getTitle = () => {
    switch (notification.type) {
      case 'gateway':
        return 'Gateway Sync';
      case 'error':
        return 'Error Alert';
      default:
        return `${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)} Emergency`;
    }
  };

  return (
    <div
      className={`notification-toast glass-card border ${config.border} bg-gradient-to-br ${config.color} p-4 shadow-2xl ${config.glow} flex items-start gap-3 pointer-events-auto transition-all duration-300 ${
        exiting ? 'exit' : ''
      }`}
    >
      {/* Icon with bounce animation */}
      <span className="text-2xl flex-shrink-0 mt-0.5 animate-bounce">
        {config.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <p className={`text-sm font-bold ${config.accent} tracking-tight`}>
          {getTitle()}
        </p>

        {/* Message */}
        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed line-clamp-2">
          {notification.message}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-700/30">
          <span className="text-[10px] text-slate-400 font-mono">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </span>
          {notification.hopsReached !== undefined && (
            <span className="text-[10px] text-slate-400 font-mono">
              📡 {notification.hopsReached} hops
            </span>
          )}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={handleDismiss}
        className="text-slate-400 hover:text-slate-200 transition-colors text-lg leading-none flex-shrink-0 hover:scale-110"
      >
        ×
      </button>
    </div>
  );
}
