import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

const io = new Server({
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type"],
  },
});

let onlineUser = [];

const addUser = (userId, socketId) => {
  const userExits = onlineUser.find((user) => user.userId === userId);
  if (!userExits) {
    onlineUser.push({ userId, socketId });
  }
};

const removeUser = (socketId) => {
  onlineUser = onlineUser.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUser.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("newUser", (userId) => {
    console.log("User connected:", userId);
    addUser(userId, socket.id);
    console.log("Current online users:", onlineUser);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    removeUser(socket.id);
    console.log("Remaining online users:", onlineUser);
  });

  socket.on("sendMessage", ({ receiverId, data }) => {
    console.log("Broadcasting message:", {
      receiverId,
      data,
      senderSocketId: socket.id,
    });

    // Send to the sender separately to handle their UI update
    socket.emit("getMessage", { ...data, fromSelf: true });

    // Broadcast to other clients
    socket.broadcast.emit("getMessage", { ...data, fromSelf: false });
    console.log("Message broadcasted to all clients");
  });
});
const PORT = process.env.PORT || 4000;
io.listen(PORT);
console.log(`Socket server is running on port ${PORT}`);
