/**
 * mesh-simulator/index.js – Module entry point
 * Exports MeshNetwork class and packet utilities
 */

const MeshNetwork = require('./MeshNetwork');
const { createPacket, PRIORITY_MAP } = require('./Packet');

module.exports = { MeshNetwork, createPacket, PRIORITY_MAP };
