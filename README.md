# 🎨 Real-Time Whiteboard Sharing App 

## 🌟 Overview
Welcome to the **Real-Time Whiteboard Sharing App** — a collaborative, real-time whiteboard built with **React**, **Node.js**, and **Socket.IO**.  
Multiple users can join shared rooms, draw together using a variety of tools, and see updates instantly. Perfect for **team brainstorming**, **remote learning**, or **creative collaboration**.


## ✨ Features

- **🖊️ Real-Time Collaboration:** Draw side-by-side with others in the same room — every stroke syncs instantly!  
- **🎨 Drawing Tools:** Choose between **Pencil**, **Line**, and **Rectangle** tools, all with customizable colors.  
- **👥 User Management:** See who’s online in real time, with your name highlighted for easy tracking.  
- **🔗 Room Creation & Joining:** Generate unique room IDs or join existing ones seamlessly.  
- **↩️ Undo / Redo:** Step backward or forward through your drawing history.  
- **🧹 Clear Canvas:** Reset the whiteboard for a fresh start — updates instantly for all users.  
- **📱 Responsive Design:** Works beautifully on desktops, tablets, and mobile devices.
- 

## 🛠️ Prerequisites

Before you begin, make sure you have:

- **Node.js** (v14.x or later)  
- **npm** (v6.x or later)  
- A basic understanding of **React**, **Node.js**, and **Socket.IO**


## 🚀 Installation

### 🧩 Server Setup

```bash
# Navigate to the server directory
cd Real-time-Whiteboard-Platform/server

# Install dependencies
npm install

# Start the server
node server.js
```

> The server will be live at: [http://localhost:5000](http://localhost:5000)



### 💻 Frontend Setup

```bash
# Navigate to the frontend directory
cd Real-time-Whiteboard-Platform/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

> The frontend will be accessible at: [http://localhost:3000](http://localhost:3000)  
> **Note:** Ensure your `package.json` includes a `dev` script (e.g., `"dev": "react-scripts start"`). If not, use `npm start` as a fallback.


## 🎮 Usage

1. Open your browser and visit **[http://localhost:3000](http://localhost:3000)**  
2. **Create a Room:** Enter your name, generate a unique room ID, and click **Create Room**  
3. **Join a Room:** Enter your name and an existing room ID, then click **Join Room**  
4. Draw freely using **Pencil**, **Line**, or **Rectangle** tools, and customize colors via the color picker  
5. Click **Users** to view a list of currently active participants  
6. Use **Undo**, **Redo**, or **Clear Canvas** to manage your drawing space  


## 📂 Project Structure

```
Real-time-Whiteboard-Platform/
├── server/
│   ├── server.js               # Core server logic (Socket.IO + Node.js)
│   ├── utils/                  # Utility functions (e.g., user management)
│   └── package.json            # Server dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.js              # Main React component
│   │   ├── Canvas.js           # Drawing logic and canvas rendering
│   │   ├── Room.js             # Room interface and controls
│   │   ├── Sidebar.js          # User list sidebar
│   │   ├── JoinCreateRoom.js   # Room creation/joining hub
│   │   ├── index.js            # App entry point
│   │   └── style.css           # Styling and layout
│   └── package.json            # Frontend dependencies
│
├── README.md                   # Project documentation (this file)
```

---

## 💻 Technologies Used

### 🧠 Frontend

* **React** – for building a dynamic, responsive UI  
* **Rough.js** – to create hand-drawn effects  
* **Bootstrap** – for responsive styling and layout  
* **React Toastify** – for elegant user notifications  

### ⚙️ Server

* **Node.js** – lightweight JavaScript runtime for the server  
* **Express** – for routing and server structure  
* **Socket.IO** – for real-time bidirectional communication  

### 🎨 Styling

* **CSS** – enhanced with **Bootstrap** for a clean, responsive design  



## 🤝 Contributing

We welcome contributions from the community! Here’s how you can help:

1. **Fork** the repository  
2. **Create a new branch:**

   ```bash
   git checkout -b feature-name
   ```
3. **Make your changes** and **commit** them:

   ```bash
   git commit -m "Add feature-name"
   ```
4. **Push** your branch:

   ```bash
   git push origin feature-name
   ```
5. **Submit a pull request** — and let’s collaborate!

---

## 🐛 Issues & Bugs

If you encounter a bug or issue, please:

* Open an issue in the GitHub repository (if hosted), describing the problem clearly  
* Include screenshots or console logs (if applicable)  
* Or contact the maintainer directly  

---

## 📜 License
This project is licensed under the **MIT License** — see details in the project documentation or contact the maintainer for more information.

---

## 🙌 Acknowledgments

* Inspired by tools like **Google Jamboard**  
* Thanks to the open-source community for amazing libraries such as **Rough.js** and **Socket.IO**
