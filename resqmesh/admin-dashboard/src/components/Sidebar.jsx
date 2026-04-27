/**
 * Sidebar.jsx – Admin Dashboard Sidebar Navigation
 */
const NAV_ITEMS = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'emergencies', icon: '🚨', label: 'Live Emergencies' },
  { id: 'network', icon: '📡', label: 'Network Graph' },
  { id: 'logs', icon: '📋', label: 'Event Logs' },
];

export default function Sidebar({ activeView, onNavigate, connected }) {
  return (
    <aside className="w-64 h-screen glass-card rounded-none border-t-0 border-l-0 border-b-0 flex flex-col p-4 sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <span className="text-3xl">🖥️</span>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">ResQMesh</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Admin Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeView === item.id
                ? 'bg-electric-500/15 text-electric-400 border border-electric-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700/50 border border-transparent'
              }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Connection Status */}
      <div className="mt-auto pt-4 border-t border-slate-700/30 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-xs text-slate-400">{connected ? 'Connected to Backend' : 'Disconnected'}</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">ws://localhost:3001</p>
      </div>
    </aside>
  );
}
