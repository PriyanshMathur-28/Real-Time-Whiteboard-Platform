import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import io from "socket.io-client";
import Room from "./Room";
import JoinCreateRoom from "./JoinCreateRoom";
import Sidebar from "./Sidebar";

import "./style.css";

const server = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';const connectionOptions = {
  "force new connection": true,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
  transports: ["websocket"],
};

const App = () => {
  const [userNo, setUserNo] = useState(0);
  const [roomJoined, setRoomJoined] = useState(false);
  const [user, setUser] = useState({});
  const [users, setUsers] = useState([]);
  const [socket, setSocket] = useState(null); // FIXED: Move socket inside

  const uuid = () => {
    var S4 = () => {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (
      S4() +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      S4() +
      S4()
    );
  };

  useEffect(() => {
    const newSocket = io(server, connectionOptions);
    setSocket(newSocket);

    return () => newSocket.close(); // Cleanup
  }, []);

  useEffect(() => {
    if (roomJoined && socket && user.roomId) { // FIXED: Add checks
      socket.emit("user-joined", user);
    }
  }, [roomJoined, user, socket]); // FIXED: Add dependencies

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
        <JoinCreateRoom
          uuid={uuid}
          setRoomJoined={setRoomJoined}
          setUser={setUser}
        />
      )}
    </div>
  );
};

export default App;