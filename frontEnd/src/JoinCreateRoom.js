import React, { useState } from "react";
import "./JoinCreateRoom.css";

const JoinCreateRoom = ({ uuid, setUser, setRoomJoined }) => {
  const [roomId, setRoomId] = useState(uuid());
  const [name, setName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!name) {
      alert("Please enter your name!");
      return;
    }

    setUser({
      roomId,
      userId: uuid(),
      userName: name,
      host: true,
      presenter: true,
    });
    setRoomJoined(true);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!joinName || !joinRoomId) {
      alert("Please enter your name and Room ID!");
      return;
    }

    setUser({
      roomId: joinRoomId,
      userId: uuid(),
      userName: joinName,
      host: false,
      presenter: false,
    });
    setRoomJoined(true);
  };

  return (
    <div className="wb-page">
      {/* Navigation */}
      <nav className="wb-nav">
        <div className="wb-nav-content">
          <div className="wb-logo">
            <svg className="wb-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 19l7-7 3 3-7 7-3-3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="wb-logo-text">Whiteboard</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="wb-hero">
        <div className="wb-container">
          <div className="wb-badge-wrapper">
            <div className="wb-badge">
              <svg className="wb-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Real-time Collaboration
            </div>
          </div>
          
          <h1 className="wb-title">
            Draw Together. Create Magic.
          </h1>
          
          <p className="wb-subtitle">
            The most elegant whiteboard platform for teams, educators, and creators.
            Unlock real-time collaboration—no latency, no login, no credit card needed.
          </p>

          {/* Cards Grid */}
          <div className="wb-cards-grid">
            {/* Create Room Card */}
            <div 
              className={`wb-card ${hoveredCard === 'create' ? 'wb-card-hovered' : ''}`}
              onMouseEnter={() => setHoveredCard('create')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="wb-card-glow wb-glow-orange"></div>
              
              <div className="wb-card-content">
                <div className="wb-card-icon wb-icon-orange">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                
                <h3 className="wb-card-title">Create Room</h3>
                <p className="wb-card-desc">Start a new collaboration session instantly</p>
                
                <div className="wb-form">
                  <div className="wb-input-group">
                    <label className="wb-label">Your Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="wb-input"
                    />
                  </div>

                  <div className="wb-input-group">
                    <label className="wb-label">Room ID</label>
                    <div className="wb-room-id-group">
                      <input
                        type="text"
                        value={roomId}
                        readOnly
                        className="wb-input wb-room-id"
                      />
                      <button
                        type="button"
                        onClick={() => setRoomId(uuid())}
                        className="wb-btn-icon wb-btn-generate"
                        title="Generate new ID"
                      >
                        ↻
                      </button>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="wb-btn-icon wb-btn-copy"
                        title="Copy Room ID"
                      >
                        {copied ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateSubmit}
                    className="wb-btn-primary wb-btn-orange"
                  >
                    <span>Create Room</span>
                    <svg className="wb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Join Room Card */}
            <div 
              className={`wb-card ${hoveredCard === 'join' ? 'wb-card-hovered' : ''}`}
              onMouseEnter={() => setHoveredCard('join')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="wb-card-glow wb-glow-rose"></div>
              
              <div className="wb-card-content">
                <div className="wb-card-icon wb-icon-rose">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                
                <h3 className="wb-card-title">Join Room</h3>
                <p className="wb-card-desc">Connect to an existing session</p>
                
                <div className="wb-form">
                  <div className="wb-input-group">
                    <label className="wb-label">Your Name</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={joinName}
                      onChange={(e) => setJoinName(e.target.value)}
                      className="wb-input"
                    />
                  </div>

                  <div className="wb-input-group">
                    <label className="wb-label">Room ID</label>
                    <input
                      type="text"
                      placeholder="Enter room ID"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value)}
                      className="wb-input wb-monospace"
                    />
                  </div>

                  <button
                    onClick={handleJoinSubmit}
                    className="wb-btn-primary wb-btn-rose"
                  >
                    <span>Join Room</span>
                    <svg className="wb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <p className="wb-footer-text">
            No credit card required • Free forever • Start collaborating instantly
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinCreateRoom;