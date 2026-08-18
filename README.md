# 🎨 Real-Time Collaborative Whiteboard Platform

A modern, full-stack, real-time collaborative whiteboard web application built with **React**, **Node.js**, **Express**, **Socket.IO**, and **MongoDB**. Designed for seamless real-time team brainstorms, teaching, sketching, and interactive collaboration.

---

## ✨ Features

### 🖌️ Collaborative Canvas & Tools
* **Rough.js Hand-Drawn Aesthetics**: Natural, responsive freehand pencil and geometric shape rendering (lines, rectangles, circles, ellipses, triangles).
* **Rich Styling Controls**: Custom stroke colors, stroke widths, fill toggles, custom fill colors, and variable-size eraser.
* **Text & Sticky Notes**: In-canvas text typing and interactive sticky notes with multi-line greedy word wrapping.
* **Live Presence & Remote Cursors**: See all connected collaborators moving in real time with tagged usernames.
* **Live Reactions**: Floating animated emoji bursts (👍, ❤️, 🎉, 😂, 👏, 🔥, 👀, 🤔) synced across all participants.
* **Live In-Room Chat**: Integrated real-time messaging panel with unread badge indicators and timestamped history.
* **Canvas Controls**: Unlimited scalable drawing area, undo stroke history, full canvas clear for rooms, and high-resolution PNG export.

### 🛡️ Smart Session Management & Host Security
* **Single Active Tab / Session Enforcement**: Prevents a single account from opening conflicting sessions across multiple tabs or simultaneous boards via `BroadcastChannel` and server-side socket locks.
* **Dynamic Host Roles**: Only the creator/owner of a room receives the **Host** badge in the topbar and participant roster.
* **Capacity & Safety Limits**: Caps maximum elements, max concurrent participants (20 per room), and sanitizes drawing coordinates.

### 📊 Dashboard & Board Persistence
* **Personal Dashboard ("My Boards")**: View, search, rename, create, rejoin, or remove your created and participated whiteboards.
* **Debounced Auto-Saving**: Live board elements and chat history are debounced (1.5s) and saved to MongoDB, plus flushed immediately on room teardown.
* **Join via Invite Link or Custom Code**: Instant sharing with custom alphanumeric meeting IDs or 1-click invite URLs (`?room=<id>`).

### 🔐 Authentication & Security
* **User Accounts**: Secure user registration, JWT-based authentication, and password hashing with `bcryptjs`.
* **Password Reset Flow**: Time-limited cryptographic token emailed via SMTP (or logged to server console during development).
* **Protected Routing**: Navigation guards with token verification and auto-recovery.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Rough.js, Socket.IO Client, Lucide Icons, React Toastify |
| **Styling** | Modern Responsive Vanilla CSS, Glassmorphism, CSS Grid & Flexbox |
| **Backend** | Node.js, Express 5, Socket.IO 4, Mongoose, JWT, Nodemailer, Bcryptjs |
| **Database** | MongoDB Atlas / Local MongoDB |

---

## 📁 Repository Structure

```
whiteboard-app/
├── client/                     # React Frontend Application
│   ├── public/                 # Static HTML & assets
│   └── src/
│       ├── components/         # React Views (BoardPage, Canvas, Chat, MyBoards, etc.)
│       ├── context/            # AuthContext (State & Token management)
│       ├── css/                # Component & Global Styles
│       ├── App.js              # Application Routes & Protected Wrappers
│       └── index.js            # Entry Point
│   └── package.json
├── server/                     # Node.js + Express + Socket.IO Backend
│   ├── models/                 # Mongoose Schemas (User, Room, Session)
│   ├── routes/                 # Express API (Auth & Boards)
│   ├── utils/                  # In-memory Socket Roster & Mailer
│   ├── server.js               # Main Server & Socket.IO Event Handlers
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
* [Node.js](https://nodejs.org/) (v16+ recommended)
* [MongoDB](https://www.mongodb.com/) (Local instance or free MongoDB Atlas URI)
* `git` and `npm`

---

### 1. Backend Setup

1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```

2. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Configure your `server/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   MONGODB_URI=mongodb://127.0.0.1:27017/whiteboard
   JWT_SECRET=your_super_secret_jwt_key_here

   # Optional: For outgoing password reset emails (leave blank to print links in terminal)
   SMTP_HOST=
   SMTP_PORT=587
   SMTP_USER=
   SMTP_PASS=
   SMTP_FROM="Whiteboard <no-reply@yourdomain.com>"
   ```

4. Install dependencies and start the backend:
   ```bash
   npm install
   npm start
   ```
   *The backend will start on `http://localhost:5000`.*

---

### 2. Frontend Setup

1. Open a second terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```

2. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Configure your `client/.env`:
   ```env
   REACT_APP_SERVER_URL=http://localhost:5000
   ```

4. Install dependencies and start the React dev server:
   ```bash
   npm install
   npm start
   ```
   *The web application will open at `http://localhost:3000`.*

---

## 📡 REST API & Socket.IO Events

### REST Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Create a new user account | No |
| `POST` | `/api/auth/login` | Log in and receive JWT | No |
| `GET` | `/api/auth/me` | Fetch currently authenticated user | Yes (Bearer) |
| `POST` | `/api/auth/forgot-password` | Request password reset token | No |
| `POST` | `/api/auth/reset-password` | Reset password using email token | No |
| `GET` | `/api/boards` | Fetch user's created and joined boards | Yes (Bearer) |
| `DELETE` | `/api/boards/:roomId` | Delete board (owner) or remove from dashboard (participant) | Yes (Bearer) |
| `GET` | `/api/health` | Server uptime and DB connection status | No |

### Key Socket.IO Events

| Event Name | Direction | Description |
|---|---|---|
| `user-joined` | Client ➔ Server | Join whiteboard room with user metadata and session verification |
| `drawing` | Bi-directional | Transmit live canvas drawing elements and shapes |
| `cursor-move` | Bi-directional | Broadcast live remote mouse cursor coordinates |
| `reaction` | Bi-directional | Trigger real-time floating emoji bursts |
| `chat-message` | Bi-directional | Broadcast chat message to room participants |
| `clearCanvas` | Bi-directional | Clear all drawing elements in the active room |
| `boardInfo` | Server ➔ Client | Send board name, room ID, and host status |
| `join-error` | Server ➔ Client | Inform client of room full, duplicate tab, or validation error |
| `leave-room` | Client ➔ Server | Gracefully leave whiteboard room |

---

## 🌐 Production Deployment Guide

### 1. Database (MongoDB Atlas)
* Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
* Under **Network Access**, allow IP `0.0.0.0/0`.
* Obtain your connection URI and replace credentials.

### 2. Backend (Render / Railway)
* Deploy from the `server/` root directory.
* Set Build Command: `npm install`
* Set Start Command: `node server.js`
* Add Environment Variables:
  * `NODE_ENV=production`
  * `MONGODB_URI=<Your Atlas URI>`
  * `JWT_SECRET=<Random Secret>`
  * `CLIENT_URL=<Your Deployed Frontend URL>`

### 3. Frontend (Vercel / Netlify)
* Deploy from the `client/` root directory.
* Framework Preset: **Create React App**
* Add Environment Variable:
  * `REACT_APP_SERVER_URL=<Your Deployed Backend URL>`

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
#   R e a l - T i m e - W h i t e b o a r d - P l a t f o r m  
 