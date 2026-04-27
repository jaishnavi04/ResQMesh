/**
 * Packet.js – Emergency packet data structure
 * 
 * Defines the structure and factory for emergency packets that propagate
 * through the mesh network. Each packet carries TTL, visited nodes list,
 * and priority classification for intelligent routing.
 */

const { v4: uuidv4 } = require('uuid');

/** Priority levels mapped by emergency type */
const PRIORITY_MAP = {
  fire: 'critical',
  medical: 'high',
  security: 'high',
  general: 'medium',
};

/**
 * Creates a new emergency packet ready for mesh propagation.
 * @param {Object} opts - Packet options
 * @param {string} opts.type - Emergency type (fire/medical/security/general)
 * @param {Object} opts.location - { lat, lng } coordinates
 * @param {string} opts.originNode - ID of the originating node
 * @param {string} [opts.message] - Optional text message
 * @returns {Object} Complete emergency packet
 */
function createPacket({ type, location, originNode, message = '' }) {
  return {
    id: uuidv4(),
    type: type || 'general',
    priority: PRIORITY_MAP[type] || 'medium',
    location: location || { lat: 28.6139, lng: 77.2090 },
    timestamp: new Date().toISOString(),
    ttl: 5,
    visited: [originNode],
    originNode,
    message,
    status: 'active',
    acks: [],
    hops: 0,
  };
}

module.exports = { createPacket, PRIORITY_MAP };
