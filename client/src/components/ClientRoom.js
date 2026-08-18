import React, { useEffect, useRef } from "react";
import { toast } from "react-toastify";

/**
 * ClientRoom — read-only view for non-presenting participants.
 *
 * Bug fixes:
 *  1. All socket.on() calls now have matching cleanup (socket.off()) to
 *     prevent listener accumulation on re-renders / React Strict Mode double
 *     mount.
 *  2. Removed dead `canvasImage` handler — the server never emits this event.
 *  3. All three effects merged into one to share a single cleanup path.
 */
const ClientRoom = ({ userNo, socket, setUsers, setUserNo }) => {
  const imgRef = useRef(null);

  useEffect(() => {
    const messageHandler = (data) => {
      toast.info(data.message);
    };

    const usersHandler = (data) => {
      setUsers(data);
      setUserNo(data.length);
    };

    socket.on("message", messageHandler);
    socket.on("users", usersHandler);

    // Cleanup: remove listeners when component unmounts or socket changes
    return () => {
      socket.off("message", messageHandler);
      socket.off("users", usersHandler);
    };
  }, [socket, setUsers, setUserNo]);

  return (
    <div className="container-fluid">
      <div className="row pb-2">
        <h1 className="display-5 pt-4 pb-3 text-center">
          React Drawing App - users online: {userNo}
        </h1>
      </div>
      <div className="row mt-5">
        <div
          className="col-md-8 overflow-hidden border border-dark px-0 mx-auto mt-3"
          style={{ height: "500px" }}
        >
          <img className="w-100 h-100" ref={imgRef} src="" alt="whiteboard" />
        </div>
      </div>
    </div>
  );
};

export default ClientRoom;