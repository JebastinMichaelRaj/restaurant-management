// Central place for Socket.IO connection/event wiring.
// Events emitted from controllers (order:new, order:statusUpdated,
// reservation:created, inventory:low, menu:updated, order:paid)
// are broadcast to all connected clients; the frontend filters by role.
function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join', (room) => {
      // rooms: 'kitchen', 'admin', or a specific customer id
      socket.join(room);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = initSocket;
