// In-memory registry of who's connected to which room via Socket.IO.
// This is intentionally NOT persisted — it only needs to live as long as
// the socket connections themselves do. Room *content* (drawings/chat) and
// the attendance log are what get saved to MongoDB (see models/Room.js and
// models/Session.js), not this live roster.

let users = [];

/**
 * Register a newly-joined socket as a user in a room.
 * Replaces any stale entry for this exact socket id only.
 * Duplicate-account checks are done BEFORE calling this function.
 */
function userJoin(id, username, room, host = false, presenter = false, accountId = null) {
  // Only remove stale entries for this specific socket id
  users = users.filter((u) => u.id !== id);

  const user = { id, username, room, host: !!host, presenter: !!presenter, accountId };
  users.push(user);
  return user;
}

/**
 * Find any active session for an accountId, optionally filtered to a room.
 * Pass room=null to search across ALL rooms (global uniqueness check).
 */
function getUserByAccountId(accountId, room = null, excludeSocketId = null) {
  if (!accountId) return undefined;
  const aid = accountId.toString();
  return users.find((u) => {
    if (!u.accountId || u.accountId.toString() !== aid) return false;
    if (excludeSocketId && u.id === excludeSocketId) return false;
    if (room !== null && u.room !== room) return false;
    return true;
  });
}

/**
 * All users currently registered in a given room.
 */
function getUsers(room) {
  return users.filter((u) => u.room === room);
}

/**
 * Remove a user by socket id (called on disconnect). Returns the removed
 * user object (with a `.room` field) so the caller can notify that room,
 * or `undefined` if the socket wasn't registered.
 */
function userLeave(id) {
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return undefined;
  const [removed] = users.splice(index, 1);
  return removed;
}

/**
 * Remove any user in the room matching this accountId.
 */
function removeUserByAccount(accountId, room) {
  if (!accountId) return;
  users = users.filter(
    (u) => !(u.room === room && u.accountId && u.accountId.toString() === accountId.toString())
  );
}

/**
 * Case-insensitive lookup: is `username` already taken in `room`?
 * Excludes the current socket or the same account to allow rejoining / reconnecting.
 */
function getUserByNameInRoom(username, room, excludeSocketId = null, excludeAccountId = null) {
  if (!username) return undefined;
  const target = username.trim().toLowerCase();
  return users.find((u) => {
    if (u.room !== room) return false;
    if (excludeSocketId && u.id === excludeSocketId) return false;
    if (excludeAccountId && u.accountId && u.accountId.toString() === excludeAccountId.toString()) {
      return false;
    }
    return u.username.trim().toLowerCase() === target;
  });
}

/**
 * Look up a single user by socket id.
 */
function getUserById(id) {
  return users.find((u) => u.id === id);
}

module.exports = {
  userJoin,
  getUsers,
  userLeave,
  removeUserByAccount,
  getUserByNameInRoom,
  getUserById,
  getUserByAccountId,
};
