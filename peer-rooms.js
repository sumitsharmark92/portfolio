/* ============================================================
   PEER ROOMS — Lightweight P2P Room Manager
   Uses PeerJS (WebRTC) for serverless real-time rooms.
   No backend needed — works on any static site.
   ============================================================ */
class PeerRoom {
  /**
   * @param {string} appPrefix  – unique prefix to avoid peer ID collisions
   * @param {object} callbacks  – { onOpen, onData, onPeerJoin, onPeerLeave, onError }
   */
  constructor(appPrefix, callbacks = {}) {
    this.prefix = appPrefix;
    this.cb = callbacks;
    this.peer = null;
    this.connections = new Map();   // peerId → DataConnection
    this.isHost = false;
    this.roomCode = null;
    this.myId = null;
    this.hostConn = null;           // guest's connection to host
    this._destroyed = false;
  }

  /** Generate a short room code */
  static generateCode() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  /** Create a new room (become host) */
  create() {
    return new Promise((resolve, reject) => {
      this.isHost = true;
      this.roomCode = PeerRoom.generateCode();
      const peerId = `${this.prefix}-${this.roomCode}`;

      this.peer = new Peer(peerId, { debug: 0 });

      this.peer.on('open', (id) => {
        this.myId = id;
        // Listen for incoming connections
        this.peer.on('connection', (conn) => this._handleIncoming(conn));
        if (this.cb.onOpen) this.cb.onOpen(this.roomCode, true);
        resolve(this.roomCode);
      });

      this.peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          // Code collision — try again
          this.destroy();
          this.create().then(resolve).catch(reject);
        } else {
          if (this.cb.onError) this.cb.onError(err);
          reject(err);
        }
      });
    });
  }

  /** Join an existing room by code */
  join(code) {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.roomCode = code.toLowerCase().trim();
      const hostId = `${this.prefix}-${this.roomCode}`;

      this.peer = new Peer(undefined, { debug: 0 });

      this.peer.on('open', (myId) => {
        this.myId = myId;
        const conn = this.peer.connect(hostId, { reliable: true });

        conn.on('open', () => {
          this.hostConn = conn;
          conn.on('data', (data) => {
            if (this.cb.onData) this.cb.onData(data, 'host');
          });
          conn.on('close', () => {
            if (this.cb.onPeerLeave) this.cb.onPeerLeave('host');
          });
          if (this.cb.onOpen) this.cb.onOpen(this.roomCode, false);
          resolve(this.roomCode);
        });

        conn.on('error', (err) => {
          if (this.cb.onError) this.cb.onError(err);
          reject(err);
        });

        // Timeout if host not found
        setTimeout(() => {
          if (!this.hostConn) {
            reject(new Error('Room not found or host is offline'));
          }
        }, 8000);
      });

      this.peer.on('error', (err) => {
        if (this.cb.onError) this.cb.onError(err);
        reject(err);
      });
    });
  }

  /** Handle incoming peer connection (host only) */
  _handleIncoming(conn) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      if (this.cb.onPeerJoin) this.cb.onPeerJoin(conn.peer);

      conn.on('data', (data) => {
        if (this.cb.onData) this.cb.onData(data, conn.peer);
        // Relay to all other peers (host acts as relay)
        this.broadcast(data, conn.peer);
      });

      conn.on('close', () => {
        this.connections.delete(conn.peer);
        if (this.cb.onPeerLeave) this.cb.onPeerLeave(conn.peer);
      });
    });
  }

  /** Send data to all peers (host broadcasts, guest sends to host) */
  send(data) {
    if (this.isHost) {
      this.broadcast(data);
    } else if (this.hostConn && this.hostConn.open) {
      this.hostConn.send(data);
    }
  }

  /** Broadcast data to all connected peers (host only) */
  broadcast(data, excludePeerId = null) {
    if (!this.isHost) return;
    for (const [id, conn] of this.connections) {
      if (id !== excludePeerId && conn.open) {
        conn.send(data);
      }
    }
  }

  /** Get connected peer count */
  get peerCount() {
    if (this.isHost) return this.connections.size;
    return this.hostConn && this.hostConn.open ? 1 : 0;
  }

  /** Destroy the room */
  destroy() {
    this._destroyed = true;
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections.clear();
    this.hostConn = null;
  }
}
