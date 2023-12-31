const express = require("express");
const dotenv = require("dotenv");
const chats = require("./data/Data.js");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const cors = require("cors");
const connectDB = require("./config/db.js");
const notFound = require("./middleware/errorMiddleware.js");
const errorHandler = require("./middleware/errorMiddleware.js");
const app = express();
const corsOptions ={
  origin:'https://chatter-mocha-theta.vercel.app', 
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200
}
app.use(cors(corsOptions));
dotenv.config();
connectDB();
app.use(express.json());
const PORT = process.env.PORT || 5000;
// app.get("/api/chat",(req,res)=>{
//     res.status(200).json(chats.chats)
// })
// app.get("/api/chat/:id",(req,res)=>{
//     const singleChat = chats.chats.find(c => c._id.toString() === req.params.id);
//     res.status(200).json(singleChat)
//     // console.log(req.params.id)
// })

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
// app.use(notFound)
// app.use(errorHandler)
const server = app.listen(
  PORT,
  console.log(`App running on port number ${PORT}`)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "https://chatter-mocha-theta.vercel.app",
    
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    // console.log(userData._id)
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
