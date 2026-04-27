/**
 * MeshNetwork.js – Core mesh network simulation engine
 * 
 * Simulates a decentralized mesh network of 8 nodes with:
 * - Multi-hop BFS propagation with TTL
 * - ACK system with retry logic
 * - Loop prevention via visited-node tracking
 * - Gateway nodes that sync to backend
 * - Real-time visualization events via Socket.io
 */

const { createPacket } = require('./Packet');

/** Default node configurations with positions for visualization */
const NODE_CONFIGS = [
  { id: 'node-1', name: 'Alpha', x: 0.19, y: 0.17, isGateway: false, range: 200 },
  { id: 'node-2', name: 'Bravo', x: 0.44, y: 0.10, isGateway: false, range: 200 },
  { id: 'node-3', name: 'Charlie', x: 0.72, y: 0.18, isGateway: true, range: 250 },
  { id: 'node-4', name: 'Delta', x: 0.13, y: 0.50, isGateway: false, range: 200 },
  { id: 'node-5', name: 'Echo', x: 0.44, y: 0.45, isGateway: false, range: 250 },
  { id: 'node-6', name: 'Foxtrot', x: 0.75, y: 0.48, isGateway: false, range: 200 },
  { id: 'node-7', name: 'Golf', x: 0.25, y: 0.80, isGateway: true, range: 250 },
  { id: 'node-8', name: 'Hotel', x: 0.62, y: 0.78, isGateway: false, range: 200 },
];

/** Pre-defined adjacency for the mesh topology */
const ADJACENCY = {
  'node-1': ['node-2', 'node-4', 'node-5'],
  'node-2': ['node-1', 'node-3', 'node-5'],
  'node-3': ['node-2', 'node-6'],
  'node-4': ['node-1', 'node-5', 'node-7'],
  'node-5': ['node-1', 'node-2', 'node-4', 'node-6', 'node-8'],
  'node-6': ['node-3', 'node-5', 'node-8'],
  'node-7': ['node-4', 'node-8'],
  'node-8': ['node-5', 'node-6', 'node-7'],
};

/** Retry configuration for ACK system */
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 300;

class MeshNetwork {
  /**
   * @param {Object} io - Socket.io server instance
   */
  constructor(io) {
    this.io = io;
    this.nodes = new Map();
    this.adjacency = new Map();
    this.messageLog = [];
    this.pendingAcks = new Map();
    this.propagating = false;
    this._initializeNetwork();
  }

  /** Initialize all nodes and adjacency from config */
  _initializeNetwork() {
    NODE_CONFIGS.forEach(config => {
      this.nodes.set(config.id, {
        ...config,
        status: 'online',
        messagesReceived: 0,
        messagesForwarded: 0,
        lastActive: Date.now(),
      });
    });

    Object.entries(ADJACENCY).forEach(([nodeId, neighbors]) => {
      this.adjacency.set(nodeId, [...neighbors]);
    });
  }

  /**
   * Propagate an emergency through the mesh network using BFS.
   * Emits real-time events at each hop for visualization.
   * @param {Object} emergencyData - { type, location, originNode, message }
   * @returns {Object} The completed emergency packet
   */
  async propagateEmergency(emergencyData) {
    this.propagating = true;
    const packet = createPacket(emergencyData);
    const originNodeId = packet.originNode;

    // Mark origin node
    const originNode = this.nodes.get(originNodeId);
    if (originNode) {
      originNode.status = 'alerting';
      originNode.messagesReceived++;
      originNode.lastActive = Date.now();
    }

    // Emit origin event
    this.io.emit('propagation-step', {
      packet: { ...packet },
      currentNode: originNodeId,
      fromNode: null,
      step: 0,
      type: 'origin',
      nodes: this._serializeNodes(),
    });

    // Log
    this.messageLog.push({
      timestamp: Date.now(),
      from: null,
      to: originNodeId,
      emergencyId: packet.id,
      type: 'origin',
    });

    // BFS propagation
    await this._bfsPropagation(packet, originNodeId);

    this.propagating = false;

    // Emit propagation complete
    this.io.emit('propagation-complete', {
      packet: { ...packet, visited: [...packet.visited] },
      nodes: this._serializeNodes(),
    });

    return packet;
  }

  /**
   * BFS traversal with delays for visual animation.
   * Each hop: delay → mark node → emit event → send ACK → check gateway → enqueue neighbors.
   */
  async _bfsPropagation(packet, startNodeId) {
    const queue = [{ nodeId: startNodeId, currentTtl: packet.ttl }];
    let step = 1;

    while (queue.length > 0) {
      const { nodeId, currentTtl } = queue.shift();

      if (currentTtl <= 0) continue;

      const neighbors = this.adjacency.get(nodeId) || [];

      for (const neighborId of neighbors) {
        // Loop prevention
        if (packet.visited.includes(neighborId)) continue;

        // Propagation delay for visualization
        await this._delay(700);

        // Mark visited
        packet.visited.push(neighborId);
        packet.hops++;

        const node = this.nodes.get(neighborId);
        if (node) {
          node.status = 'alerting';
          node.messagesReceived++;
          node.messagesForwarded++;
          node.lastActive = Date.now();
        }

        // Emit propagation step
        this.io.emit('propagation-step', {
          packet: { ...packet, visited: [...packet.visited] },
          currentNode: neighborId,
          fromNode: nodeId,
          step: step++,
          type: node?.isGateway ? 'gateway-reached' : 'relay',
          nodes: this._serializeNodes(),
        });

        // ACK with retry
        await this._sendAck(neighborId, nodeId, packet.id);

        // Log
        this.messageLog.push({
          timestamp: Date.now(),
          from: nodeId,
          to: neighborId,
          emergencyId: packet.id,
          type: node?.isGateway ? 'gateway-forward' : 'forward',
        });

        // Gateway sync
        if (node?.isGateway) {
          await this._delay(300);
          this.io.emit('gateway-sync', {
            nodeId: neighborId,
            nodeName: node.name,
            emergency: { ...packet, visited: [...packet.visited] },
          });
        }

        // Enqueue for further propagation
        queue.push({ nodeId: neighborId, currentTtl: currentTtl - 1 });
      }
    }
  }

  /**
   * Send ACK from receiver back to sender with retry logic.
   * Simulates network reliability issues.
   */
  async _sendAck(fromNode, toNode, emergencyId, attempt = 1) {
    // Simulate ~90% success rate
    const success = Math.random() > 0.1;

    if (success) {
      await this._delay(150);
      this.io.emit('ack-received', {
        from: fromNode,
        to: toNode,
        emergencyId,
        attempt,
        success: true,
      });
      return true;
    }

    // Retry logic
    if (attempt < MAX_RETRIES) {
      const retryDelay = RETRY_BASE_DELAY * Math.pow(2, attempt - 1);
      this.io.emit('ack-retry', {
        from: fromNode,
        to: toNode,
        emergencyId,
        attempt,
        nextRetryIn: retryDelay,
      });
      await this._delay(retryDelay);
      return this._sendAck(fromNode, toNode, emergencyId, attempt + 1);
    }

    // Final failure
    this.io.emit('ack-failed', {
      from: fromNode,
      to: toNode,
      emergencyId,
      attempts: attempt,
    });
    return false;
  }

  /** Utility delay for async propagation */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** Serialize all nodes to plain array */
  _serializeNodes() {
    return Array.from(this.nodes.values());
  }

  /** Get current network topology (nodes + edges) */
  getTopology() {
    const edges = [];
    const seen = new Set();
    this.adjacency.forEach((neighbors, nodeId) => {
      neighbors.forEach(neighborId => {
        const edgeId = [nodeId, neighborId].sort().join('↔');
        if (!seen.has(edgeId)) {
          seen.add(edgeId);
          edges.push({ id: edgeId, source: nodeId, target: neighborId });
        }
      });
    });
    return { nodes: this._serializeNodes(), edges };
  }

  /** Get all nodes */
  getNodes() {
    return this._serializeNodes();
  }

  /** Get message propagation log */
  getMessageLog() {
    return [...this.messageLog];
  }

  /** Reset all node statuses back to online */
  resetNodeStates() {
    this.nodes.forEach(node => {
      node.status = 'online';
    });
    this.io.emit('node-update', { nodes: this._serializeNodes() });
  }

  /** Check if currently propagating */
  isPropagating() {
    return this.propagating;
  }
}

module.exports = MeshNetwork;
