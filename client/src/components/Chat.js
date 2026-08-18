import React, { useState, useEffect, useRef } from "react";
import "../css/Chat.css";

const Chat = ({ socket, user, isOpen, onClose, onUnread }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleChatHistory = (history) => {
      setMessages(history);
    };

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (!isOpen) {
        onUnread && onUnread();
      }
    };

    socket.on("chatHistory", handleChatHistory);
    socket.on("chat-message", handleMessage);

    return () => {
      socket.off("chatHistory", handleChatHistory);
      socket.off("chat-message", handleMessage);
    };
  }, [socket, isOpen, onUnread]);

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || !socket || !user?.roomId) return;
    socket.emit("chat-message", { roomId: user.roomId, message: trimmed });
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (name) =>
    name
      ? name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?";

  const avatarColors = [
    "#f97316", "#e11d48", "#8b5cf6", "#0ea5e9",
    "#10b981", "#f59e0b", "#ec4899", "#6366f1",
  ];

  const getAvatarColor = (name) => {
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="chat-backdrop" onClick={onClose} />}

      {/* Panel */}
      <div className={`chat-panel ${isOpen ? "chat-panel--open" : ""}`}>
        <div className="chat-header">
          <div className="chat-header-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Room Chat
          </div>
          <button className="chat-close-btn" onClick={onClose} aria-label="Close chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p>No messages yet. Say hello!</p>
            </div>
          )}
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === socket?.id;
            return (
              <div key={idx} className={`chat-msg ${isMe ? "chat-msg--me" : "chat-msg--other"}`}>
                {!isMe && (
                  <div
                    className="chat-avatar"
                    style={{ background: getAvatarColor(msg.senderName) }}
                  >
                    {getInitials(msg.senderName)}
                  </div>
                )}
                <div className="chat-bubble-group">
                  {!isMe && <span className="chat-sender">{msg.senderName}</span>}
                  <div className={`chat-bubble ${isMe ? "chat-bubble--me" : "chat-bubble--other"}`}>
                    {msg.message}
                  </div>
                  <span className="chat-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-bar">
          <textarea
            className="chat-input"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={500}
          />
          <button
            className="chat-send-btn"
            onClick={sendMessage}
            disabled={!input.trim()}
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default Chat;