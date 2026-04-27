/**
 * EmergencyCard.jsx – Premium Emergency Details Card
 * 
 * Features:
 * - Glassmorphism design with shimmer effect
 * - Priority-based left border glow
 * - Smooth hover animations
 * - Real-time status indicators
 * - Responsive grid layout
 */

const TYPE_ICONS = {
  fire: '🔥',
  medical: '🏥',
  security: '🔒',
  general: '📢'
};

const PRIORITY_MAP = {
  'critical': 'CRITICAL',
  'high': 'HIGH',
  'medium': 'MEDIUM',
  'low': 'LOW'
};

export default function EmergencyCard({ emergency }) {
  const icon = TYPE_ICONS[emergency.type] || '📢';
  const priorityClass = `priority-${(emergency.priority || 'high').toLowerCase()}`;
  const timeAgo = getTimeAgo(emergency.timestamp);

  return (
    <div className={`glass-card glass-card-hover emergency-card ${priorityClass} p-4 animate-slide-up`}>
      {/* Header Section */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Emergency Icon with glow */}
          <div className="text-2xl flex-shrink-0 animate-float">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-100 capitalize tracking-tight">
              {emergency.type} Emergency
            </h4>
            <p className="text-xs text-slate-400 mt-1 font-mono truncate">
              ID: {emergency.id?.slice(0, 12)}...
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`badge badge-${emergency.priority?.toLowerCase() || 'high'}`}>
            {PRIORITY_MAP[emergency.priority?.toLowerCase()] || emergency.priority}
          </span>
          <span className={`badge ${emergency.status === 'active' ? 'badge-active' : 'badge-resolved'}`}>
            {emergency.status}
          </span>
        </div>
      </div>

      {/* Metrics Grid – Premium Layout */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        {/* Location */}
        <div className="glass-card p-3 rounded-lg flex items-center gap-2 bg-slate-500/5 hover:bg-slate-500/10 transition-colors">
          <span className="text-lg">📍</span>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Location</p>
            <p className="text-slate-300 font-mono text-[11px]">
              {emergency.location?.lat?.toFixed(4)}, {emergency.location?.lng?.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Time Elapsed */}
        <div className="glass-card p-3 rounded-lg flex items-center gap-2 bg-slate-500/5 hover:bg-slate-500/10 transition-colors">
          <span className="text-lg">⏱️</span>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Elapsed</p>
            <p className="text-slate-300 font-mono text-[11px]">{timeAgo}</p>
          </div>
        </div>

        {/* Nodes Reached */}
        <div className="glass-card p-3 rounded-lg flex items-center gap-2 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
          <span className="text-lg">📡</span>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Nodes Reached</p>
            <p className="text-emerald-300 font-mono text-[11px] font-bold">
              {emergency.visited?.length || 0}
            </p>
          </div>
        </div>

        {/* Hops Count */}
        <div className="glass-card p-3 rounded-lg flex items-center gap-2 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
          <span className="text-lg">🔄</span>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Hops</p>
            <p className="text-blue-300 font-mono text-[11px] font-bold">
              {emergency.hops || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Footer with Origin & Timestamp */}
      <div className="mt-4 pt-3 border-t border-slate-700/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Origin:</span>
          <span className="text-[10px] text-slate-300 font-mono font-bold">
            {emergency.originNode}
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          {new Date(emergency.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

/**
 * Calculate time elapsed since emergency
 */
function getTimeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const s = Math.floor(diff / 1000);

  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;

  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;

  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;

  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
