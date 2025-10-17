const users = [];

const userJoin = (id, username, room, host, presenter) => {
  const user = { id, username, room, host, presenter };
  users.push(user);
  return user;
};

const userLeave = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
  return null;
};

const getUsers = (room) => {
  if (!room) {
    return users; // Return all users if no room specified
  }
  return users.filter(user => user.room === room);
};

module.exports = {
  userJoin,
  userLeave,
  getUsers,
};
