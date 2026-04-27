/**
 * server.js – ResQMesh Backend Server
 * 
 * Express + Socket.io server that:
 * - Hosts REST API for emergency management
 * - Manages real-time WebSocket connections
 * - Integrates with mesh network simulator
 * - Broadcasts events to frontend and admin dashboard
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const MeshNetwork = require('../mesh-simulator/MeshNetwork');
const store = require('./store');

// ─── Server Setup ────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Socket.io with CORS for frontend (5173) and admin (5174)
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize mesh network
const mesh = new MeshNetwork(io);

// ─── REST API Routes ─────────────────────────────────────────────────

/**
 * POST /api/emergency
 * Create a new emergency and trigger mesh propagation.
 * Body: { type, location, originNode, message }
 */
app.post('/api/emergency', async (req, res) => {
  try {
    const { type, location, originNode, message } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Emergency type is required' });
    }

    if (mesh.isPropagating()) {
      return res.status(429).json({ error: 'Propagation already in progress. Please wait.' });
    }

    // Reset node states from previous emergency
    mesh.resetNodeStates();

    const selectedOrigin = originNode || 'node-1';
    const packet = await mesh.propagateEmergency({
      type,
      location: location || { lat: 28.6139 + (Math.random() - 0.5) * 0.05, lng: 77.209 + (Math.random() - 0.5) * 0.05 },
      originNode: selectedOrigin,
      message: message || '',
    });

    // Store in backend
    const { isNew, emergency } = store.addEmergency(packet);

    // Broadcast to all connected clients
    io.emit('emergency-alert', { emergency, isNew });

    res.status(201).json({ success: true, emergency });
  } catch (err) {
    console.error('Error creating emergency:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/sync
 * Gateway sync endpoint – receives data from gateway nodes.
 * Body: { nodeId, emergency }
 */
app.post('/api/sync', (req, res) => {
  try {
    const { nodeId, emergency } = req.body;

    if (!emergency || !emergency.id) {
      return res.status(400).json({ error: 'Emergency data required' });
    }

    const { isNew, emergency: stored } = store.addEmergency(emergency);
    store.recordGatewaySync();

    // Notify all clients
    io.emit('emergency-alert', { emergency: stored, isNew, syncedBy: nodeId });

    res.json({ success: true, isNew, emergency: stored });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/emergencies
 * Retrieve all emergencies, optionally filtered by status.
 * Query: ?status=active|resolved
 */
app.get('/api/emergencies', (req, res) => {
  const { status } = req.query;
  const emergencies = store.getEmergencies(status);
  res.json({ emergencies, count: emergencies.length });
});

/**
 * PATCH /api/emergencies/:id/resolve
 * Resolve an active emergency.
 */
app.patch('/api/emergencies/:id/resolve', (req, res) => {
  const emergency = store.resolveEmergency(req.params.id);
  if (!emergency) {
    return res.status(404).json({ error: 'Emergency not found' });
  }
  io.emit('emergency-resolved', { emergency });
  res.json({ success: true, emergency });
});

/**
 * GET /api/network
 * Get current mesh network topology and node states.
 */
app.get('/api/network', (req, res) => {
  const topology = mesh.getTopology();
  res.json(topology);
});

/**
 * GET /api/stats
 * Get aggregate statistics.
 */
app.get('/api/stats', (req, res) => {
  const stats = store.getStats();
  const networkStats = {
    ...stats,
    totalNodes: mesh.getNodes().length,
    gatewayNodes: mesh.getNodes().filter(n => n.isGateway).length,
    onlineNodes: mesh.getNodes().filter(n => n.status !== 'offline').length,
  };
  res.json(networkStats);
});

/**
 * GET /api/logs
 * Get message propagation logs.
 */
app.get('/api/logs', (req, res) => {
  const logs = mesh.getMessageLog();
  res.json({ logs, count: logs.length });
});

/**
 * POST /api/reset
 * Reset node states (for demo purposes).
 */
app.post('/api/reset', (req, res) => {
  mesh.resetNodeStates();
  res.json({ success: true, message: 'Node states reset' });
});

// ─── Socket.io Events ───────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Send initial topology
  socket.emit('topology', mesh.getTopology());
  socket.emit('initial-emergencies', { emergencies: store.getEmergencies() });
  socket.emit('stats-update', store.getStats());

  // Handle new emergency from frontend (Socket.io route)
  // Receives: { id, type, origin, location, priority, hops }
  socket.on('new_emergency', async (data) => {
    console.log(`🚨 [new_emergency] Received from ${socket.id}:`, data.type);

    if (mesh.isPropagating()) {
      socket.emit('error', { message: 'Propagation in progress. Please wait.' });
      return;
    }

    mesh.resetNodeStates();

    try {
      // Propagate through mesh network
      const packet = await mesh.propagateEmergency({
        type: data.type,
        location: data.location || { lat: 28.6139 + (Math.random() - 0.5) * 0.05, lng: 77.209 + (Math.random() - 0.5) * 0.05 },
        originNode: data.origin || 'node-1',
        message: data.message || '',
        priority: data.priority || 'CRITICAL',
        hops: data.hops || 0,
      });

      // Store emergency
      const { isNew, emergency } = store.addEmergency(packet);

      // Broadcast to all clients (REAL-TIME UPDATE)
      io.emit('emergency_update', {
        emergency,
        isNew,
        timestamp: new Date().toISOString(),
        activeNodes: mesh.getNodes().filter(n => n.status !== 'online').map(n => n.id),
        hopsReached: emergency.visited?.length || 0,
      });

      // Update statistics
      io.emit('stats-update', store.getStats());

      // Send confirmation back to sender
      socket.emit('emergency_confirmed', { id: emergency.id, status: 'propagating' });
    } catch (err) {
      console.error('🚨 [new_emergency] Error:', err);
      socket.emit('error', { message: 'Failed to process emergency' });
    }
  });

  // Handle SOS trigger from frontend (legacy REST-style)
  socket.on('trigger-sos', async (data) => {
    console.log(`[SOS] Received from ${socket.id}:`, data.type);

    if (mesh.isPropagating()) {
      socket.emit('error-message', { message: 'Propagation in progress. Please wait.' });
      return;
    }

    mesh.resetNodeStates();

    try {
      const packet = await mesh.propagateEmergency({
        type: data.type,
        location: data.location || { lat: 28.6139 + (Math.random() - 0.5) * 0.05, lng: 77.209 + (Math.random() - 0.5) * 0.05 },
        originNode: data.originNode || 'node-1',
        message: data.message || '',
      });

      const { isNew, emergency } = store.addEmergency(packet);
      io.emit('emergency-alert', { emergency, isNew });
      io.emit('stats-update', store.getStats());
    } catch (err) {
      console.error('[SOS] Error:', err);
      socket.emit('error-message', { message: 'Failed to process SOS' });
    }
  });

  // Handle resolve from admin
  socket.on('resolve-emergency', (data) => {
    const emergency = store.resolveEmergency(data.id);
    if (emergency) {
      io.emit('emergency-resolved', { emergency });
      io.emit('stats-update', store.getStats());
    }
  });

  // Request topology refresh
  socket.on('request-topology', () => {
    socket.emit('topology', mesh.getTopology());
  });

  // Request reset
  socket.on('reset-nodes', () => {
    mesh.resetNodeStates();
    io.emit('topology', mesh.getTopology());
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// ─── Start Server ────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║         🚨 ResQMesh Backend Server 🚨        ║');
  console.log(`  ║         Running on port ${PORT}               ║`);
  console.log('  ║                                              ║');
  console.log('  ║  REST API:  http://localhost:' + PORT + '/api       ║');
  console.log('  ║  WebSocket: ws://localhost:' + PORT + '             ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`  📡 Mesh Network: ${mesh.getNodes().length} nodes initialized`);
  console.log(`  🌉 Gateways: ${mesh.getNodes().filter(n => n.isGateway).map(n => n.name).join(', ')}`);
  console.log('');
});
