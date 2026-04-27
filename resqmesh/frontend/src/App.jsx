/**
 * App.jsx – ResQMesh Premium Frontend Application
 * 
 * Mobile-first emergency response interface with:
 * - Premium glassmorphism design
 * - Real-time Socket.io updates
 * - Smooth animations & micro-interactions
 * - Professional dashboard UX
 */
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useSocket } from './hooks/useSocket';
import SOSButton from './components/SOSButton';
import MeshVisualization from './components/MeshVisualization';
import EmergencyList from './components/EmergencyList';
import NotificationPopup from './components/NotificationPopup';

const TABS = [
  { id: 'sos', label: '🚨 SOS', mobileLabel: '🚨', icon: '📡' },
  { id: 'mesh', label: '📡 Mesh Network', mobileLabel: '📡', icon: '🕸️' },
  { id: 'alerts', label: '📋 Alerts', mobileLabel: '📋', icon: '🔔' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('sos');
  const {
    connected, topology, emergencies, propagationSteps,
    currentPropagation, notifications, resetNodes, dismissNotification,
  } = useSocket();

  const isPropagating = !!currentPropagation;
  const activeEmergencies = emergencies.filter(e => e.status === 'active').length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* React Hot Toast Container */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={12}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            backdropFilter: 'blur(20px)',
          },
        }}
      />

      {/* PREMIUM HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-700/30">
        <div className="glass-card rounded-none border-x-0 border-t-0 px-4 py-4 flex items-center justify-between">
          {/* Brand Section */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-900 animate-pulse">
              <span className="text-lg">🚨</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-black text-white tracking-tight truncate">
                ResQMesh
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">Emergency Mesh Network</p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Alert Count Badge */}
            {activeEmergencies > 0 && (
              <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600/20 to-red-900/20 border border-red-600/30 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs font-bold text-red-300">{activeEmergencies} Active</span>
              </div>
            )}

            {/* Reset Button */}
            <button
              onClick={resetNodes}
              className="px-3 py-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-600/60 text-slate-300 hover:text-slate-100 text-xs font-medium border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300"
              title="Reset mesh network state"
            >
              Reset
            </button>

            {/* Connection Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/20 border border-slate-600/30">
              <div
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  connected
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-red-400'
                }`}
              />
              <span className="text-xs text-slate-300 font-medium">
                {connected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Legacy Notifications */}
      <NotificationPopup notifications={notifications} onDismiss={dismissNotification} />

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 pb-24 max-w-6xl mx-auto w-full">
        <div className="animate-fade-in">
          {/* SOS TAB */}
          {activeTab === 'sos' && (
            <div className="space-y-6">
              <SOSButton isPropagating={isPropagating} />
              <div className="mt-8">
                <MeshVisualization
                  topology={topology}
                  currentPropagation={currentPropagation}
                  propagationSteps={propagationSteps}
                />
              </div>
            </div>
          )}

          {/* MESH TAB */}
          {activeTab === 'mesh' && (
            <div className="space-y-6">
              <MeshVisualization
                topology={topology}
                currentPropagation={currentPropagation}
                propagationSteps={propagationSteps}
              />

              {/* Propagation Log */}
              {propagationSteps.length > 0 && (
                <div className="glass-card glass-card-hover p-6">
                  <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <span>📝</span> Propagation Log
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {propagationSteps.map((step, i) => (
                      <div
                        key={i}
                        className="text-xs text-slate-400 flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-700/30 transition-colors border border-slate-700/20"
                      >
                        <span className="text-slate-500 font-mono w-8 text-right font-bold">#{step.step}</span>
                        <span className={
                          step.type === 'gateway-reached' ? 'text-emerald-400 text-lg' :
                          step.type === 'origin' ? 'text-red-400 text-lg' :
                          'text-blue-400 text-lg'
                        }>
                          {step.type === 'origin' ? '🎯' : step.type === 'gateway-reached' ? '🌉' : '📡'}
                        </span>
                        <span className="flex-1 font-mono">
                          {step.fromNode ? `${step.fromNode} → ${step.currentNode}` : `Origin: ${step.currentNode}`}
                        </span>
                        <span className={`badge text-[10px] ${
                          step.type === 'gateway-reached' ? 'badge-active' : 'badge-medium'
                        }`}>
                          {step.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ALERTS TAB */}
          {activeTab === 'alerts' && (
            <EmergencyList emergencies={emergencies} />
          )}
        </div>
      </main>

      {/* PREMIUM BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-700/30 glass-card rounded-none border-x-0 border-b-0 px-2 py-3 flex justify-around z-40">
        {TABS.map(tab => {
          const tabEmergencies = tab.id === 'alerts' ? emergencies.length : 0;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn relative flex-1 mx-1 flex flex-col items-center gap-1 transition-all duration-300 group ${
                activeTab === tab.id ? 'active' : ''
              }`}
              title={tab.label}
            >
              <span className="text-lg">{tab.mobileLabel}</span>
              <span className="hidden sm:inline text-xs font-medium">{tab.label.split(' ')[1] || tab.label}</span>

              {/* Badge for alert count */}
              {tabEmergencies > 0 && tab.id === 'alerts' && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {tabEmergencies}
                </span>
              )}

              {/* Active indicator */}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-400" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
