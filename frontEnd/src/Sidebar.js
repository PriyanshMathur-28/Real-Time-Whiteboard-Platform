import React, { useRef } from "react";

const Sidebar = ({ users, user, socket }) => {
  const sideBarRef = useRef(null);

  const openSideBar = () => {
    sideBarRef.current.style.left = "0";
  };

  const closeSideBar = () => {
    sideBarRef.current.style.left = "-100%";
  };

  return (
    <>
      <button
        className="btn btn-dark btn-sm"
        onClick={openSideBar}
        style={{ position: "absolute", top: "5%", left: "5%" }}
      >
        Users ({users.length})
      </button>
      <div
        className="position-fixed pt-2 h-100 bg-dark"
        ref={sideBarRef}
        style={{
          width: "150px",
          left: "-100%",
          transition: "0.3s linear",
          zIndex: "9999",
        }}
      >
        <button
          className="btn btn-block border-0 form-control rounded-0 btn-light"
          onClick={closeSideBar}
        >
          Close
        </button>
        <div className="w-100 mt-5">
          {users.length > 0 ? ( // Safeguard against empty array
            users.map((usr) => (
              <p key={usr.id} className="text-white text-center py-2">
                {usr.username} {/* FIXED: Use username instead of userName */}
                {usr.id === socket.id && " - (You)"}
              </p>
            ))
          ) : (
            <p className="text-white text-center py-2">No users</p> // Debug fallback
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
