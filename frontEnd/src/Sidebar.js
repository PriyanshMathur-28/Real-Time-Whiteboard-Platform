import React, { useRef } from "react";
import { Users, X } from "lucide-react";

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
        onClick={openSideBar}
        style={{
          position: 'fixed',
          top: '40rem',
          left: '1.5rem',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          background: 'linear-gradient(to bottom right, #fb923c, #ec4899)',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontWeight: '500',
          boxShadow: '0 4px 14px rgba(251, 146, 60, 0.4)',
          fontSize: '0.875rem'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 20px rgba(251, 146, 60, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 14px rgba(251, 146, 60, 0.4)';
        }}
      >
        <Users style={{ width: '1rem', height: '1rem' }} />
        Users ({users.length})
      </button>
      <div
        ref={sideBarRef}
        style={{
          position: 'fixed',
          top: 0,
          left: '-100%',
          width: '250px',
          height: '100vh',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          transition: 'left 0.3s ease',
          zIndex: 99,
          padding: '1rem',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
          borderRight: '1px solid #e5e7eb'
        }}
      >
        <button
          onClick={closeSideBar}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'linear-gradient(to bottom right, #fb923c, #ec4899)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '2rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          <X style={{ width: '1rem', height: '1rem' }} />
          Close
        </button>
        <div style={{ marginTop: '2rem' }}>
          {users.length > 0 ? (
            users.map((usr) => (
              <div
                key={usr.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  background: usr.id === socket.id ? 'linear-gradient(to bottom right, #fef3c7, #fce7f3)' : 'white',
                  borderRadius: '0.75rem',
                  marginBottom: '0.5rem',
                  border: usr.id === socket.id ? '1px solid #fde68a' : '1px solid #e5e7eb',
                  textAlign: 'center',
                  fontWeight: usr.id === socket.id ? 'bold' : 'normal',
                  color: '#111827'
                }}
              >
                <Users style={{ width: '1rem', height: '1rem', color: '#fb923c' }} />
                <span>{usr.username}</span>
                {usr.id === socket.id && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}> (You)</span>}
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#9ca3af',
              fontStyle: 'italic'
            }}>
              No users
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;