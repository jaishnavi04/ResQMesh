/**
 * App.jsx – ResQMesh Admin Dashboard Application
 */
import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import Sidebar from './components/Sidebar';
import StatsPanel from './components/StatsPanel';
import LiveEmergencies from './components/LiveEmergencies';
import NetworkGraph from './components/NetworkGraph';
import EmergencyLogs from './components/EmergencyLogs';

export default function App() {
  const [activeView, setActiveView] = useState('overview');
  const {
    connected, topology, emergencies, propagationSteps,
    currentPropagation, stats, resolveEmergency, resetNodes,
  } = useSocket();

  return (
    <div className="flex min-h-screen">
      <Sidebar activeView={activeView} onNavigate={setActiveView} connected={connected} />

      <main className="flex-1 p-6 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white capitalize">
              {activeView === 'overview' ? '📊 Dashboard Overview' :
                activeView === 'emergencies' ? '🚨 Live Emergencies' :
                  activeView === 'network' ? '📡 Network Graph' : '📋 Event Logs'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Real-time mesh network monitoring</p>
          </div>
          <button
            onClick={resetNodes}
            className="px-4 py-2 text-xs rounded-xl bg-navy-700/60 text-slate-400 hover:text-slate-200 border border-slate-600/30 transition-colors font-medium"
          >
            🔄 Reset Nodes
          </button>
        </div>

        {/* Views */}
        {activeView === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <StatsPanel stats={stats} emergencies={emergencies} topology={topology} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <NetworkGraph topology={topology} currentPropagation={currentPropagation} />
              <LiveEmergencies emergencies={emergencies} onResolve={resolveEmergency} />
            </div>
          </div>
        )}

        {activeView === 'emergencies' && (
          <div className="animate-fade-in max-w-3xl">
            <LiveEmergencies emergencies={emergencies} onResolve={resolveEmergency} />
          </div>
        )}

        {activeView === 'network' && (
          <div className="animate-fade-in">
            <NetworkGraph topology={topology} currentPropagation={currentPropagation} />
            {/* Node Details */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {topology.nodes.map(node => (
                <div key={node.id} className={`glass-card p-3 border-l-4 ${node.status === 'alerting' ? 'border-l-red-500' :
                    node.isGateway ? 'border-l-emerald-500' : 'border-l-blue-500'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{node.name}</span>
                    {node.isGateway && <span className="text-[10px] text-emerald-400 font-bold">GW</span>}
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">{node.id}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'alerting' ? 'bg-red-400' : 'bg-emerald-400'
                      }`} />
                    <span className="text-[10px] text-slate-400 capitalize">{node.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Msgs: {node.messagesReceived || 0}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'logs' && (
          <div className="animate-fade-in">
            <EmergencyLogs emergencies={emergencies} propagationSteps={propagationSteps} />
          </div>
        )}
      </main>
    </div>
  );
}
