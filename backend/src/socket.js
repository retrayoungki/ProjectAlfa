const { Server } = require("socket.io");

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "*", 
        methods: ["GET", "POST"]
      }
    });

    io.on("connection", (socket) => {
      console.log("Client connected via Socket.IO:", socket.id);

      socket.on("join_channel", (channelId) => {
        socket.join(channelId);
        console.log(`Socket ${socket.id} joined channel ${channelId}`);
      });

      socket.on("leave_channel", (channelId) => {
        socket.leave(channelId);
        console.log(`Socket ${socket.id} left channel ${channelId}`);
      });

      // Receive a new message from a client and broadcast it to the channel room
      socket.on("send_message", (data) => {
        // data: { channelId, message }
        socket.to(data.channelId).emit("receive_message", data.message);
      });

      // Broadcast typing indicator
      socket.on("typing", (data) => {
        // data: { channelId, userId, userName, isTyping }
        socket.to(data.channelId).emit("user_typing", data);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  }
};
