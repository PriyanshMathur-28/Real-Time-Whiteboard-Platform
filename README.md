🎨 Real-Time Whiteboard Sharing App

🌟 Overview
Welcome to the Real-Time Whiteboard Sharing App! This vibrant, collaborative whiteboard is crafted with React for the frontend and powered by Node.js with Socket.IO on the backend. It enables multiple users to join a shared room, draw together using tools like pencil, line, and rectangle, and experience updates in real-time. Packed with user management, customizable drawing options, and seamless synchronization, this app is ideal for team brainstorming or creative collaborations!

✨ Features

Real-Time Collaboration: Draw alongside others with instant sync across the room!
Drawing Tools: Unleash your creativity with Pencil, Line, and Rectangle, all with customizable colors.
User Management: Peek at a live list of online users and easily spot yourself.
Room Creation/Joining: Generate unique room IDs or join existing ones with ease.
Undo/Redo: Navigate your drawing history with a simple step back or forward.
Clear Canvas: Reset the whiteboard for a fresh start, shared with all users.
Responsive Design: Enjoy a fluid experience on any device or screen size.


🛠️ Prerequisites
Before you begin, ensure you have:

Node.js (v14.x or later)
npm (v6.x or later)
A basic understanding of React, Node.js, and Socket.IO


🚀 Installation
Backend Setup

Navigate to the project root directory.

Install backend dependencies:
cd backend
npm install


Launch the server:
node server.js

The server will be live at http://localhost:5000.


Frontend Setup

Switch to the frontend directory.

Install frontend dependencies:
cd frontend
npm install


Start the development server:
npm start

The app will be accessible at http://localhost:3000.



🎮 Usage

Open your browser and head to http://localhost:3000.
Create a Room: Enter your name, generate a unique room ID, and click "Create Room".
Join a Room: Input your name and the room ID shared by the host, then click "Join Room".
Get creative with Pencil, Line, or Rectangle tools, and adjust colors with the picker.
Click "Users" to view online participants.
Manage your artwork with Undo, Redo, or Clear Canvas as needed.


📂 Project Structure
Real-time-Whiteboard-Platform/
├── backend/
│   ├── server.js          # The heartbeat of the server
│   ├── utils/             # Utility magic (e.g., user management)
│   └── package.json       # Backend dependency manifest
├── frontend/
│   ├── src/
│   │   ├── App.js         # The main app component
│   │   ├── Canvas.js      # Where drawing magic unfolds
│   │   ├── Room.js        # The room interface
│   │   ├── Sidebar.js     # User list sidebar
│   │   ├── JoinCreateRoom.js # Room creation/joining hub
│   │   ├── index.js       # App entry point
│   │   └── style.css      # Styling finesse
│   └── package.json       # Frontend dependency manifest
├── README.md              # You’re here! 🎉


💻 Technologies Used
Frontend

React: Dynamic and responsive UI
Rough.js: Adds hand-drawn effect charm
Bootstrap: Sleek, responsive styling
React Toastify: User-friendly notifications

Backend

Node.js: Robust server foundation
Express: Efficient routing
Socket.IO: Real-time communication powerhouse

Styling

CSS enhanced with Bootstrap


🤝 Contributing
Love this project? Join us to make it even better!

Fork the repository.
Create a new branch: git checkout -b feature-name.
Make your changes and commit: git commit -m "Add feature-name".
Push to the branch: git push origin feature-name.
Submit a pull request—let’s collaborate!


🐛 Issues & Bugs
Spotted a glitch? Let us know by:

Opening an issue on the GitHub repository (if hosted), or
Contacting the maintainer directly.


📜 License
This project is licensed under the MIT License—check the LICENSE file for details.

🙌 Acknowledgments

Inspired by innovative tools like Google Jamboard.
A big shoutout to the open-source community for gems like Rough.js and Socket.IO!


Last Updated: 05:43 PM IST, Friday, October 17, 2025Made with ❤️ by the xAI Community
