/**
 * EmergencyList.jsx – Premium Recent Emergencies List
 * 
 * Features:
 * - Empty state with helpful messaging
 * - Animated list appearance
 * - Responsive grid layout
 * - Premium typography
 */

import EmergencyCard from './EmergencyCard';

export default function EmergencyList({ emergencies }) {
  if (!emergencies.length) {
    return (
      <div className="glass-card glass-card-hover p-12 text-center space-y-4 animate-fade-in">
        <div className="text-6xl mb-4">🛡️</div>
        <div>
          <h3 className="text-lg font-bold text-slate-200 mb-2">No Active Emergencies</h3>
          <p className="text-sm text-slate-400">
            The network is operating normally. All emergency alerts will appear here.
          </p>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-700/30">
          <p className="text-xs text-slate-500 font-mono">
            Trigger an SOS to see real-time emergency propagation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header with count badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">
              Recent Emergencies
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Real-time mesh network alerts
            </p>
          </div>
        </div>
        <div className="badge badge-active badge-pulse">
          {emergencies.length} Total
        </div>
      </div>

      {/* Emergency Cards Grid */}
      <div className="space-y-3">
        {emergencies.slice(0, 15).map((em, idx) => (
          <div key={em.id} style={{ animationDelay: `${idx * 50}ms` }}>
            <EmergencyCard emergency={em} />
          </div>
        ))}
      </div>

      {/* Show more indicator */}
      {emergencies.length > 15 && (
        <div className="glass-card p-4 text-center text-sm text-slate-400">
          ... and {emergencies.length - 15} more emergencies
        </div>
      )}
    </div>
  );
}
