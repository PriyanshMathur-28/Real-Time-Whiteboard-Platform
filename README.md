# Real-Time Collaborative Whiteboard Platform

A full-stack real-time collaborative whiteboard application built using React, Node.js, Express, Socket.IO, and MongoDB.

The platform allows multiple users to collaborate on the same whiteboard in real time, communicate through chat, share reactions, and persist their boards for later use.

## Features

### Collaborative Whiteboard

- Freehand drawing with Rough.js
- Lines, rectangles, circles, ellipses, and triangles
- Adjustable stroke color and width
- Custom fill colors
- Fill and outline controls
- Variable-size eraser
- Text and sticky notes
- Undo support
- Clear canvas
- PNG canvas export
- Scalable drawing area

### Real-Time Collaboration

- Real-time drawing synchronization
- Live remote cursors
- Participant usernames
- Live room presence
- Real-time emoji reactions
- Integrated room chat
- Timestamped messages
- Unread message indicators

### Room Management

- Create whiteboard rooms
- Join existing rooms
- Custom room codes
- Shareable invite links
- Host identification
- Participant limits
- Canvas element limits
- Input validation and sanitization

### Authentication

- User registration
- User login
- JWT authentication
- Password hashing using bcryptjs
- Protected routes
- Authentication state management
- Forgot-password functionality
- Password reset using time-limited tokens
- SMTP support for password reset emails

### Dashboard and Persistence

- Personal "My Boards" dashboard
- View created boards
- View joined boards
- Search boards
- Rename boards
- Rejoin boards
- Delete boards
- Automatic board saving
- Chat history persistence
- MongoDB database storage

### Session Security

- Single active session/tab enforcement
- BroadcastChannel-based session detection
- Server-side socket session locking
- Host ownership validation
- Room capacity protection
- Coordinate validation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 |
| Routing | React Router v6 |
| Canvas | Rough.js |
| Icons | Lucide React |
| Notifications | React Toastify |
| Real-Time Communication | Socket.IO |
| Backend | Node.js |
| API Framework | Express 5 |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT |
| Password Hashing | bcryptjs |
| Email | Nodemailer |
| Styling | CSS, Flexbox, CSS Grid |

---

## Repository Structure

```text
Real-Time-Whiteboard-Platform/
│
├── client/
│   ├── public/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── css/
│   │   ├── App.js
│   │   └── index.js
│   │
│   ├── .env
│   └── package.json
│
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Room.js
│   │   └── Session.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   └── boards.js
│   │
│   ├── utils/
│   │   ├── mailer.js
│   │   └── ...
│   │
│   ├── server.js
│   ├── .env
│   └── package.json
│
├── .gitignore
└── README.md
