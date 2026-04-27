/**
 * NetworkGraph.jsx – Admin Dashboard Network Visualization
 * Full-size mesh network graph with Canvas rendering.
 */
import { useEffect, useRef, useState } from 'react';

const NODE_COLORS = {
  online: { fill: '#1e293b', stroke: '#3b82f6', text: '#94a3b8' },
  alerting: { fill: '#7f1d1d', stroke: '#ef4444', text: '#fca5a5' },
  gateway: { fill: '#064e3b', stroke: '#10b981', text: '#6ee7b7' },
};

export default function NetworkGraph({ topology, currentPropagation }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);
  const [dim, setDim] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current?.parentElement;
      if (c) setDim({ width: Math.min(c.clientWidth - 2, 1000), height: 520 });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Particles for animation
  useEffect(() => {
    if (!currentPropagation?.fromNode) return;
    const from = topology.nodes.find(n => n.id === currentPropagation.fromNode);
    const to = topology.nodes.find(n => n.id === currentPropagation.currentNode);
    if (from && to) {
      particlesRef.current.push({
        fromX: from.x * dim.width, fromY: from.y * dim.height,
        toX: to.x * dim.width, toY: to.y * dim.height,
        progress: 0, speed: 0.02,
      });
    }
  }, [currentPropagation, topology.nodes, dim]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dim.width * dpr;
    canvas.height = dim.height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, dim.width, dim.height);

      // Grid
      ctx.strokeStyle = 'rgba(59,130,246,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < dim.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, dim.height); ctx.stroke(); }
      for (let y = 0; y < dim.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(dim.width, y); ctx.stroke(); }

      const visitedSet = new Set(currentPropagation?.packet?.visited || []);

      // Edges
      topology.edges.forEach(edge => {
        const s = topology.nodes.find(n => n.id === edge.source);
        const t = topology.nodes.find(n => n.id === edge.target);
        if (!s || !t) return;
        const active = visitedSet.has(s.id) && visitedSet.has(t.id);
        ctx.beginPath();
        ctx.moveTo(s.x * dim.width, s.y * dim.height);
        ctx.lineTo(t.x * dim.width, t.y * dim.height);
        ctx.strokeStyle = active ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.12)';
        ctx.lineWidth = active ? 2.5 : 1;
        ctx.stroke();
      });

      // Particles
      particlesRef.current = particlesRef.current.filter(p => p.progress <= 1);
      particlesRef.current.forEach(p => {
        p.progress += p.speed;
        const x = p.fromX + (p.toX - p.fromX) * p.progress;
        const y = p.fromY + (p.toY - p.fromY) * p.progress;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
        g.addColorStop(0, 'rgba(239,68,68,0.8)');
        g.addColorStop(1, 'rgba(239,68,68,0)');
        ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = '#ef4444'; ctx.fill();
      });

      // Nodes
      topology.nodes.forEach(node => {
        const x = node.x * dim.width;
        const y = node.y * dim.height;
        const r = node.isGateway ? 26 : 22;
        const alerting = node.status === 'alerting' || visitedSet.has(node.id);
        const colors = alerting ? NODE_COLORS.alerting : (node.isGateway ? NODE_COLORS.gateway : NODE_COLORS.online);

        // Glow for current
        if (node.id === currentPropagation?.currentNode) {
          const gl = ctx.createRadialGradient(x, y, r, x, y, r + 25);
          gl.addColorStop(0, 'rgba(239,68,68,0.3)'); gl.addColorStop(1, 'rgba(239,68,68,0)');
          ctx.beginPath(); ctx.arc(x, y, r + 25, 0, Math.PI * 2); ctx.fillStyle = gl; ctx.fill();
        }

        // Gateway ring
        if (node.isGateway) {
          ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2);
          ctx.strokeStyle = alerting ? 'rgba(249,115,22,0.4)' : 'rgba(16,185,129,0.3)';
          ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
        }

        // Node body
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = colors.fill; ctx.fill();
        ctx.strokeStyle = colors.stroke; ctx.lineWidth = 2; ctx.stroke();

        // Text
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(node.id.replace('node-', 'N'), x, y);
        ctx.fillStyle = colors.text; ctx.font = '10px Inter';
        ctx.fillText(node.name, x, y + r + 14);
        if (node.isGateway) { ctx.fillStyle = alerting ? '#f97316' : '#10b981'; ctx.font = 'bold 8px Inter'; ctx.fillText('GATEWAY', x, y + r + 26); }
      });

      animRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animRef.current);
  }, [topology, dim, currentPropagation]);

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-electric-500 animate-pulse" />
          <span className="text-sm font-semibold text-slate-200">Network Topology</span>
        </div>
        <span className="text-xs text-slate-500">{topology.nodes.length} nodes • {topology.edges.length} edges</span>
      </div>
      <canvas ref={canvasRef} style={{ width: dim.width, height: dim.height }} className="block" />
    </div>
  );
}
