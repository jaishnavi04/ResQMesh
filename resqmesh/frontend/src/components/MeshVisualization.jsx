/**
 * MeshVisualization.jsx – Network Graph Visualization
 * 
 * HTML5 Canvas-based network graph that displays:
 * - All mesh nodes with status indicators
 * - Connections between adjacent nodes
 * - Animated message propagation along edges
 * - Gateway node highlights
 * - Real-time state updates
 */

import { useEffect, useRef, useState } from 'react';

/** Color scheme for node states */
const NODE_COLORS = {
  online: { fill: '#1e293b', stroke: '#3b82f6', text: '#94a3b8' },
  alerting: { fill: '#7f1d1d', stroke: '#ef4444', text: '#fca5a5' },
  gateway: { fill: '#064e3b', stroke: '#10b981', text: '#6ee7b7' },
  'gateway-alerting': { fill: '#7f1d1d', stroke: '#f97316', text: '#fdba74' },
};

export default function MeshVisualization({ topology, currentPropagation, propagationSteps }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const w = Math.min(container.clientWidth - 2, 900);
        const h = Math.max(400, Math.min(w * 0.6, 550));
        setDimensions({ width: w, height: h });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create particle when propagation step occurs
  useEffect(() => {
    if (!currentPropagation || !currentPropagation.fromNode) return;

    const fromNode = topology.nodes.find(n => n.id === currentPropagation.fromNode);
    const toNode = topology.nodes.find(n => n.id === currentPropagation.currentNode);
    if (!fromNode || !toNode) return;

    const particle = {
      id: Date.now() + Math.random(),
      fromX: fromNode.x * dimensions.width,
      fromY: fromNode.y * dimensions.height,
      toX: toNode.x * dimensions.width,
      toY: toNode.y * dimensions.height,
      progress: 0,
      speed: 0.025,
      type: currentPropagation.type,
    };
    particlesRef.current.push(particle);
  }, [currentPropagation, topology.nodes, dimensions]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw background grid
      drawGrid(ctx, dimensions);

      // Draw edges
      drawEdges(ctx, topology, dimensions, currentPropagation);

      // Draw particles
      drawParticles(ctx, particlesRef);

      // Draw nodes
      drawNodes(ctx, topology, dimensions, currentPropagation);

      // Draw legend
      drawLegend(ctx, dimensions);

      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animRef.current);
  }, [topology, dimensions, currentPropagation]);

  return (
    <div className="mesh-canvas-container">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-electric-500 animate-pulse" />
          <span className="text-sm font-semibold text-slate-200">Mesh Network Topology</span>
        </div>
        <span className="text-xs text-slate-500">
          {topology.nodes.length} nodes • {topology.edges.length} connections
        </span>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height }}
        className="block"
      />
    </div>
  );
}

// ─── Drawing Functions ─────────────────────────────────────────────

function drawGrid(ctx, dim) {
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
  ctx.lineWidth = 1;
  const step = 40;
  for (let x = 0; x < dim.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, dim.height);
    ctx.stroke();
  }
  for (let y = 0; y < dim.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(dim.width, y);
    ctx.stroke();
  }
}

function drawEdges(ctx, topology, dim, currentProp) {
  const visitedSet = new Set(currentProp?.packet?.visited || []);

  topology.edges.forEach(edge => {
    const source = topology.nodes.find(n => n.id === edge.source);
    const target = topology.nodes.find(n => n.id === edge.target);
    if (!source || !target) return;

    const sx = source.x * dim.width;
    const sy = source.y * dim.height;
    const tx = target.x * dim.width;
    const ty = target.y * dim.height;

    const isActive = visitedSet.has(source.id) && visitedSet.has(target.id);

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = isActive ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.15)';
    ctx.lineWidth = isActive ? 2.5 : 1;
    ctx.stroke();

    // Glow on active edges
    if (isActive) {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.lineWidth = 8;
      ctx.stroke();
    }
  });
}

function drawParticles(ctx, particlesRef) {
  particlesRef.current = particlesRef.current.filter(p => p.progress <= 1);

  particlesRef.current.forEach(p => {
    p.progress += p.speed;
    const x = p.fromX + (p.toX - p.fromX) * p.progress;
    const y = p.fromY + (p.toY - p.fromY) * p.progress;

    // Glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 16);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
    gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.2)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Core dot
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

function drawNodes(ctx, topology, dim, currentProp) {
  const visitedSet = new Set(currentProp?.packet?.visited || []);
  const currentNodeId = currentProp?.currentNode;

  topology.nodes.forEach(node => {
    const x = node.x * dim.width;
    const y = node.y * dim.height;
    const radius = node.isGateway ? 24 : 20;
    const isAlerting = node.status === 'alerting' || visitedSet.has(node.id);
    const isCurrent = node.id === currentNodeId;

    // Outer glow for current node
    if (isCurrent) {
      const glow = ctx.createRadialGradient(x, y, radius, x, y, radius + 30);
      glow.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
      glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.beginPath();
      ctx.arc(x, y, radius + 30, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }

    // Gateway ring
    if (node.isGateway) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = isAlerting ? 'rgba(249, 115, 22, 0.5)' : 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Node circle
    const colors = isAlerting
      ? (node.isGateway ? NODE_COLORS['gateway-alerting'] : NODE_COLORS.alerting)
      : (node.isGateway ? NODE_COLORS.gateway : NODE_COLORS.online);

    const grad = ctx.createRadialGradient(x - 4, y - 4, 0, x, y, radius);
    grad.addColorStop(0, colors.fill);
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Node ID text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.id.replace('node-', 'N'), x, y);

    // Node name below
    ctx.fillStyle = colors.text;
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(node.name, x, y + radius + 14);

    // Gateway badge
    if (node.isGateway) {
      ctx.fillStyle = isAlerting ? '#f97316' : '#10b981';
      ctx.font = 'bold 8px Inter, sans-serif';
      ctx.fillText('GATEWAY', x, y + radius + 26);
    }
  });
}

function drawLegend(ctx, dim) {
  const x = 16;
  let y = dim.height - 80;

  ctx.fillStyle = 'rgba(10, 14, 26, 0.85)';
  ctx.fillRect(x, y - 10, 140, 80);
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y - 10, 140, 80);

  ctx.font = '9px Inter, sans-serif';

  // Legend items
  const items = [
    { color: '#3b82f6', label: 'Online Node' },
    { color: '#10b981', label: 'Gateway Node' },
    { color: '#ef4444', label: 'Alerting Node' },
  ];

  items.forEach((item, i) => {
    ctx.beginPath();
    ctx.arc(x + 16, y + i * 22 + 6, 6, 0, Math.PI * 2);
    ctx.fillStyle = item.color;
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, x + 30, y + i * 22 + 6);
  });
}
