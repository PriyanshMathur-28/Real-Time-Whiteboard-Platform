<div align="center">

# 🎨 Real-Time Collaborative Whiteboard Platform

A full-stack, real-time collaborative whiteboard built with **React**, **Node.js**, **Express**, **Socket.IO**, and **MongoDB** — designed for team brainstorms, teaching, sketching, and interactive collaboration.

[![Node.js](https://img.shields.io/badge/Node.js-v16%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%7C%20Local-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started-local-development)
- [REST API & Socket.IO Events](#-rest-api--socketio-events)
- [Production Deployment](#-production-deployment-guide)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🖌️ Collaborative Canvas & Tools
- **Rough.js hand-drawn aesthetics** — natural, responsive freehand pencil and geometric shape rendering (lines, rectangles, circles, ellipses, triangles).
- **Rich styling controls** — custom stroke colors, stroke widths, fill toggles, custom fill colors, and a variable-size eraser.
- **Text & sticky notes** — in-canvas text typing and interactive sticky notes with multi-line greedy word wrapping.
- **Live presence & remote cursors** — see all connected collaborators moving in real time with tagged usernames.
- **Live reactions** — floating animated emoji bursts (👍 ❤️ 🎉 😂 👏 🔥 👀 🤔) synced across all participants.
- **Live in-room chat** — integrated real-time messaging panel with unread badge indicators and timestamped history.
- **Canvas controls** — unlimited scalable drawing area, undo stroke history, full canvas clear, and high-resolution PNG export.

### 🛡️ Smart Session Management & Host Security
- **Single active tab / session enforcement** — prevents a single account from opening conflicting sessions across multiple tabs or boards, via `BroadcastChannel` and server-side socket locks.
- **Dynamic host roles** — only the creator/owner of a room receives the **Host** badge in the topbar and participant roster.
- **Capacity & safety limits** — caps on maximum elements and concurrent participants (20 per room), plus sanitized drawing coordinates.

### 📊 Dashboard & Board Persistence
- **Personal dashboard ("My Boards")** — view, search, rename, create, rejoin, or remove your created and joined whiteboards.
- **Debounced auto-saving** — live board elements and chat history are debounced (1.5s) and saved to MongoDB, with an immediate flush on room teardown.
- **Join via invite link or custom code** — instant sharing with custom alphanumeric meeting IDs or one-click invite URLs (`?room=<id>`).

### 🔐 Authentication & Security
- **User accounts** — secure registration, JWT-based authentication, and password hashing with `bcryptjs`.
- **Password reset flow** — time-limited cryptographic token emailed via SMTP (or logged to the server console in development).
- **Protected routing** — navigation guards with token verification and auto-recovery.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Rough.js, Socket.IO Client, Lucide Icons, React Toastify |
| **Styling** | Modern responsive vanilla CSS, glassmorphism, CSS Grid & Flexbox |
| **Backend** | Node.js, Express 5, Socket.IO 4, Mongoose, JWT, Nodemailer, bcryptjs |
| **Database** | MongoDB Atlas / local MongoDB |

---

## 📁 Repository Structure

```
whiteboard-app/
├── client/                     # React frontend application
│   ├── public/                 # Static HTML & assets
│   ├── src/
│   │   ├── components/         # React views (BoardPage, Canvas, Chat, MyBoards, etc.)
│   │   ├── context/             # AuthContext (state & token management)
│   │   ├── css/                 # Component & global styles
│   │   ├── App.js               # Application routes & protected wrappers
│   │   └── index.js             # Entry point
│   └── package.json
├── server/                     # Node.js + Express + Socket.IO backend
│   ├── models/                  # Mongoose schemas (User, Room, Session)
│   ├── routes/                  # Express API (auth & boards)
│   ├── utils/                   # In-memory socket roster & mailer
│   ├── server.js                # Main server & Socket.IO event handlers
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (local instance or a free MongoDB Atlas URI)
- `git` and `npm`

### 1. Backend Setup

```bash
cd server
cp .env.example .env
```

Configure `server/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/whiteboard
JWT_SECRET=your_super_secret_jwt_key_here

# Optional: for outgoing password reset emails (leave blank to print links in the terminal)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Whiteboard <no-reply@yourdomain.com>"
```

Install dependencies and start the server:

```bash
npm install
npm start
```

The backend starts on `http://localhost:5000`.

### 2. Frontend Setup

In a second terminal:

```bash
cd client
cp .env.example .env
```

Configure `client/.env`:

```env
REACT_APP_SERVER_URL=http://localhost:5000
```

Install dependencies and start the dev server:

```bash
npm install
npm start
```

The app opens at `http://localhost:3000`.

---

## 📡 REST API & Socket.IO Events

### REST Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Create a new user account | No |
| `POST` | `/api/auth/login` | Log in and receive a JWT | No |
| `GET` | `/api/auth/me` | Fetch the currently authenticated user | Yes (Bearer) |
| `POST` | `/api/auth/forgot-password` | Request a password reset token | No |
| `POST` | `/api/auth/reset-password` | Reset password using an email token | No |
| `GET` | `/api/boards` | Fetch the user's created and joined boards | Yes (Bearer) |
| `DELETE` | `/api/boards/:roomId` | Delete a board (owner) or remove it from the dashboard (participant) | Yes (Bearer) |
| `GET` | `/api/health` | Server uptime and DB connection status | No |

### Key Socket.IO Events

| Event Name | Direction | Description |
|---|---|---|
| `user-joined` | Client → Server | Join a whiteboard room with user metadata and session verification |
| `drawing` | Bi-directional | Transmit live canvas drawing elements and shapes |
| `cursor-move` | Bi-directional | Broadcast live remote mouse cursor coordinates |
| `reaction` | Bi-directional | Trigger real-time floating emoji bursts |
| `chat-message` | Bi-directional | Broadcast a chat message to room participants |
| `clearCanvas` | Bi-directional | Clear all drawing elements in the active room |
| `boardInfo` | Server → Client | Send board name, room ID, and host status |
| `join-error` | Server → Client | Inform the client of a full room, duplicate tab, or validation error |
| `leave-room` | Client → Server | Gracefully leave a whiteboard room |

---

## 🌐 Production Deployment Guide

### 1. Database (MongoDB Atlas)
- Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- Under **Network Access**, allow IP `0.0.0.0/0`.
- Obtain your connection URI and replace the placeholder credentials.

### 2. Backend (Render / Railway)
- Deploy from the `server/` directory.
- **Build command:** `npm install`
- **Start command:** `node server.js`
- Environment variables:
  - `NODE_ENV=production`
  - `MONGODB_URI=<your Atlas URI>`
  - `JWT_SECRET=<random secret>`
  - `CLIENT_URL=<your deployed frontend URL>`

### 3. Frontend (Vercel / Netlify)
- Deploy from the `client/` directory.
- **Framework preset:** Create React App
- Environment variable:
  - `REACT_APP_SERVER_URL=<your deployed backend URL>`

---

## 🤝 Contributing

Contributions are welcome! To get started:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request.

Please open an issue first for major changes to discuss what you'd like to modify.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).#   R e a l - T i m e - W h i t e b o a r d - P l a t f o r m  
 