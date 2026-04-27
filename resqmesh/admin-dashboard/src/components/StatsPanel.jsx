/**
 * StatsPanel.jsx – Real-time Statistics Cards
 */
export default function StatsPanel({ stats, emergencies, topology }) {
  const cards = [
    { label: 'Total Emergencies', value: stats.totalEmergencies || 0, icon: '🚨', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { label: 'Active Alerts', value: stats.activeEmergencies || 0, icon: '⚡', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Resolved', value: stats.resolvedEmergencies || 0, icon: '✅', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Online Nodes', value: topology.nodes?.length || 0, icon: '📡', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Gateway Nodes', value: topology.nodes?.filter(n => n.isGateway).length || 0, icon: '🌉', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { label: 'Messages Relayed', value: stats.totalMessages || 0, icon: '💬', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <div key={i} className={`glass-card p-4 border ${card.bg} animate-slide-up`} style={{ animationDelay: `${i * 50}ms` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{card.icon}</span>
            <span className={`text-2xl font-bold ${card.color}`}>{card.value}</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
