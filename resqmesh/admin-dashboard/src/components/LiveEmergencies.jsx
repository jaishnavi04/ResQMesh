/**
 * LiveEmergencies.jsx – Real-time emergency feed with resolve actions
 */
const TYPE_ICONS = { fire: '🔥', medical: '🏥', security: '🔒', general: '📢' };

export default function LiveEmergencies({ emergencies, onResolve }) {
  const active = emergencies.filter(e => e.status === 'active');
  const resolved = emergencies.filter(e => e.status === 'resolved');

  return (
    <div className="space-y-6">
      {/* Active Emergencies */}
      <div>
        <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          Active Emergencies ({active.length})
        </h3>
        {active.length === 0 ? (
          <div className="glass-card p-6 text-center text-slate-500 text-sm">No active emergencies</div>
        ) : (
          <div className="space-y-3">
            {active.map(em => (
              <div key={em.id} className="glass-card p-4 border-l-4 border-l-red-500 animate-slide-up">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{TYPE_ICONS[em.type] || '📢'}</span>
                    <div>
                      <h4 className="text-sm font-bold text-white capitalize">{em.type} Emergency</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {em.id?.slice(0, 12)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-${em.priority}`}>{em.priority}</span>
                    <button
                      onClick={() => onResolve(em.id)}
                      className="px-3 py-1 text-xs rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors font-medium"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-slate-400">
                  <div>📍 {em.location?.lat?.toFixed(4)}, {em.location?.lng?.toFixed(4)}</div>
                  <div>📡 {em.visited?.length || 0} nodes reached</div>
                  <div>🔄 {em.hops || 0} hops</div>
                </div>
                <div className="mt-2 text-[10px] text-slate-500">
                  Origin: {em.originNode} • {new Date(em.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-400 mb-3">✅ Resolved ({resolved.length})</h3>
          <div className="space-y-2">
            {resolved.slice(0, 5).map(em => (
              <div key={em.id} className="glass-card p-3 opacity-60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{TYPE_ICONS[em.type] || '📢'}</span>
                  <span className="text-xs text-slate-400 capitalize">{em.type}</span>
                  <span className="text-xs text-slate-500 font-mono">{em.id?.slice(0, 8)}</span>
                </div>
                <span className="badge badge-resolved">resolved</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
