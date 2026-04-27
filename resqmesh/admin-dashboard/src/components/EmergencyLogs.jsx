/**
 * EmergencyLogs.jsx – Event log table for admin dashboard
 */
export default function EmergencyLogs({ emergencies, propagationSteps }) {
  return (
    <div className="space-y-6">
      {/* Emergency Log Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-200">📋 Emergency Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/30">
                <th className="text-left px-4 py-2 font-medium">ID</th>
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-left px-4 py-2 font-medium">Priority</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Origin</th>
                <th className="text-left px-4 py-2 font-medium">Nodes</th>
                <th className="text-left px-4 py-2 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {emergencies.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">No emergency logs</td></tr>
              ) : (
                emergencies.map(em => (
                  <tr key={em.id} className="border-b border-slate-700/20 hover:bg-navy-700/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-slate-300">{em.id?.slice(0, 8)}</td>
                    <td className="px-4 py-2.5 capitalize text-slate-300">{em.type}</td>
                    <td className="px-4 py-2.5"><span className={`badge badge-${em.priority}`}>{em.priority}</span></td>
                    <td className="px-4 py-2.5"><span className={`badge ${em.status === 'active' ? 'badge-active' : 'badge-resolved'}`}>{em.status}</span></td>
                    <td className="px-4 py-2.5 text-slate-400">{em.originNode}</td>
                    <td className="px-4 py-2.5 text-slate-400">{em.visited?.length || 0}</td>
                    <td className="px-4 py-2.5 text-slate-500">{new Date(em.timestamp).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Propagation Steps Log */}
      {propagationSteps.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-200">📝 Propagation Trace (Latest)</h3>
          </div>
          <div className="max-h-64 overflow-y-auto p-4 space-y-1">
            {propagationSteps.slice(-20).map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-slate-700/15">
                <span className="text-slate-500 w-6 text-right font-mono">#{step.step}</span>
                <span>{step.type === 'origin' ? '🎯' : step.type === 'gateway-reached' ? '🌉' : '📡'}</span>
                <span className="text-slate-300">
                  {step.fromNode ? `${step.fromNode} → ${step.currentNode}` : `Origin: ${step.currentNode}`}
                </span>
                <span className={`badge ml-auto ${step.type === 'gateway-reached' ? 'badge-active' : 'badge-medium'}`}>
                  {step.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
