# 🚨 ResQMesh – Resilient Mesh Emergency Response System

A decentralized, offline-first emergency communication platform where mobile devices act as nodes in a mesh network to propagate emergency alerts even without internet connectivity.

## 🏗️ Architecture

```
resqmesh/
├── backend/          → Express + Socket.io server (port 3001)
├── frontend/         → React SOS trigger & mesh visualization (port 5173)
├── admin-dashboard/  → React admin monitoring dashboard (port 5174)
└── mesh-simulator/   → Mesh network simulation engine
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Install & Run

```bash
# 1. Install all dependencies
npm run install:all
npm install

# 2. Start all services
npm start
```

This launches:
- **Backend** → http://localhost:3001
- **Frontend** → http://localhost:5173
- **Admin Dashboard** → http://localhost:5174

## 🎯 Demo Flow

1. Open **Frontend** (http://localhost:5173) – select emergency type, click SOS
2. Watch the **mesh visualization** – packets propagate through nodes
3. Open **Admin Dashboard** (http://localhost:5174) – see live updates
4. **Resolve** emergencies from the admin panel

## ⚙️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/emergency | Create emergency & trigger mesh propagation |
| POST | /api/sync | Gateway sync endpoint |
| GET | /api/emergencies | List all emergencies |
| PATCH | /api/emergencies/:id/resolve | Resolve an emergency |
| GET | /api/network | Get mesh topology |
| GET | /api/stats | Get statistics |

## 📡 Mesh Network

- **8 nodes** in a pre-defined topology
- **2 gateways** (Charlie, Golf) that sync to backend
- **TTL-based routing** with loop prevention
- **ACK system** with exponential backoff retries
- **BFS propagation** with visualization delays

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Socket.io-client
- **Backend**: Node.js, Express, Socket.io
- **Visualization**: HTML5 Canvas
- **Storage**: In-memory (swappable to MongoDB)
