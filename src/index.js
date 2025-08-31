import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import hbs from "hbs";
import http from "http";
import { Server } from "socket.io";
import { Filter } from "bad-words";
import messages from "./utlis/messages.js";
import users from "./utlis/users.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const server = http.createServer(app);

// Socket.IO connection
const io = new Server(server);

// let count = 0;
const { generateMessage, generateLocationMessage } = messages;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  //   socket.emit('countUpdated', count);

  //   socket.on('increment', () => {
  //     count++
  //     // socket.emit('countUpdated', count);
  //     io.emit('countUpdated', count);
  //   })

  socket.on("join", (options, callback) => {
    const { error, user } = users.addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    socket.join(user.room); // ✅ always use normalized room

    socket.emit("message", generateMessage(user.username, "Welcome!")); // only to this user
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage(user.username, `${user.username} has joined!`)); // to everyone in the room except this user

      io.to(user.room).emit('roomData', {
        room: user.room,
        users: users.getUsersInRoom(user.room)
      })

    callback();
  });

  socket.on("message", (data, callback) => {
    const filter = new Filter();
    if (filter.isProfane(data)) {
      return callback("Profanity is not allowed");
    }
    const user = users.getUser(socket.id)
    console.log("Received message:", data);
    io.to(user.room).emit("message", generateMessage(user.username, data));
    callback();
  });

  socket.on("sendLocation", (location, callback) => {
    const user = users.getUser(socket.id)
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
      )
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = users.removeUser(socket.id);
    console.log("User disconnected:", socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(user.username, `${user.username} has left the chat`)
      );

      io.to(user.room).emit('roomData', {
        room: user.room,
        users: users.getUsersInRoom(user.room)
      })
    }
  });
});

const publicDirectoryPath = path.join(__dirname, "../public");

app.set("view engine", "hbs");

app.use(express.static(publicDirectoryPath));

app.get("/", (req, res) => {
  res.render("index");
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
