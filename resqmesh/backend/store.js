/**
 * store.js – In-memory data store for ResQMesh
 * 
 * Provides storage and retrieval for emergencies with:
 * - Deduplication by emergency ID
 * - Priority classification
 * - Status management (active/resolved)
 * - Statistics aggregation
 * 
 * Designed to be easily swappable with MongoDB later.
 */

class Store {
  constructor() {
    /** @type {Map<string, Object>} Emergency records keyed by ID */
    this.emergencies = new Map();

    /** @type {Array<Object>} Ordered log of all events */
    this.eventLog = [];

    /** @type {Object} Aggregate counters */
    this.stats = {
      totalEmergencies: 0,
      activeEmergencies: 0,
      resolvedEmergencies: 0,
      totalMessages: 0,
      gatewaySyncs: 0,
    };
  }

  /**
   * Add or update an emergency. Deduplicates by ID.
   * @param {Object} emergency - Emergency packet
   * @returns {{ isNew: boolean, emergency: Object }}
   */
  addEmergency(emergency) {
    const existing = this.emergencies.get(emergency.id);

    if (existing) {
      // Update with latest hop information
      existing.visited = [...new Set([...existing.visited, ...(emergency.visited || [])])];
      existing.hops = Math.max(existing.hops || 0, emergency.hops || 0);
      existing.lastUpdated = new Date().toISOString();
      this.emergencies.set(emergency.id, existing);
      return { isNew: false, emergency: existing };
    }

    // New emergency
    const record = {
      ...emergency,
      receivedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      resolvedAt: null,
    };
    this.emergencies.set(emergency.id, record);
    this.stats.totalEmergencies++;
    this.stats.activeEmergencies++;

    this._logEvent('emergency_created', { id: emergency.id, type: emergency.type });

    return { isNew: true, emergency: record };
  }

  /**
   * Resolve an emergency by ID.
   * @param {string} id - Emergency ID
   * @returns {Object|null} Updated emergency or null if not found
   */
  resolveEmergency(id) {
    const emergency = this.emergencies.get(id);
    if (!emergency) return null;

    emergency.status = 'resolved';
    emergency.resolvedAt = new Date().toISOString();
    emergency.lastUpdated = new Date().toISOString();
    this.stats.activeEmergencies = Math.max(0, this.stats.activeEmergencies - 1);
    this.stats.resolvedEmergencies++;

    this._logEvent('emergency_resolved', { id });

    return emergency;
  }

  /**
   * Get all emergencies, optionally filtered by status.
   * @param {string} [status] - Filter by status ('active'/'resolved')
   * @returns {Array<Object>} Emergency records sorted by timestamp (newest first)
   */
  getEmergencies(status) {
    let results = Array.from(this.emergencies.values());
    if (status) {
      results = results.filter(e => e.status === status);
    }
    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get a single emergency by ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getEmergency(id) {
    return this.emergencies.get(id) || null;
  }

  /**
   * Record a gateway sync event.
   */
  recordGatewaySync() {
    this.stats.gatewaySyncs++;
    this.stats.totalMessages++;
  }

  /**
   * Record a message relay event.
   */
  recordMessage() {
    this.stats.totalMessages++;
  }

  /**
   * Get aggregate statistics.
   * @returns {Object}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get event log, optionally limited.
   * @param {number} [limit=50]
   * @returns {Array<Object>}
   */
  getEventLog(limit = 50) {
    return this.eventLog.slice(-limit);
  }

  /** Internal: log an event */
  _logEvent(type, data) {
    this.eventLog.push({
      timestamp: new Date().toISOString(),
      type,
      ...data,
    });
  }
}

module.exports = new Store();
