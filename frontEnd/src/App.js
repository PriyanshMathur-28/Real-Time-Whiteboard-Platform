import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import io from "socket.io-client";
import Room from "./Room";
import JoinCreateRoom from "./JoinCreateRoom";
import Sidebar from "./Sidebar";
import "./style.css";

const App = () => {
  const [userNo, setUserNo] = useState(0);
  const [roomJoined, setRoomJoined] = useState(false);
  const [user, setUser] = useState({});
  const [users, setUsers] = useState([]); // State for users list
  const [socket, setSocket] = useState(null);

  const uuid = () => {
    const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    return `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;
  };

  useEffect(() => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";
    const wsUrl = serverUrl.replace("http", "ws").replace("https", "wss");
    const newSocket = io(wsUrl, { transports: ["websocket"], reconnectionAttempts: 5, timeout: 10000 });
    setSocket(newSocket);

    // Listen for users event
    newSocket.on("users", (roomUsers) => {
      setUsers(roomUsers);
      setUserNo(roomUsers.length); // Update user count
    });

    return () => newSocket.close(); // Cleanup
  }, []);

  useEffect(() => {
    if (roomJoined && socket && user.roomId) socket.emit("user-joined", user);
  }, [roomJoined, user, socket]);

  return (
    <div className="home">
      <ToastContainer />
      {roomJoined ? (
        <>
          <Sidebar users={users} user={user} socket={socket} />
          <Room
            userNo={userNo}
            user={user}
            socket={socket}
            setUsers={setUsers}
            setUserNo={setUserNo}
          />
        </>
      ) : (
        <JoinCreateRoom uuid={uuid} setRoomJoined={setRoomJoined} setUser={setUser} />
      )}
    </div>
  );
};

export default App;