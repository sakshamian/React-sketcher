const app = require('express')();
const { createServer } = require('http');
const { Server } = require("socket.io");
const cors = require("cors");

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: 'http://localhost:3000' });
app.use(cors({ origin: '*' }));

io.on("connection", (socket) => {
    console.log("servercon");
    socket.on("beginPath", (arg) => {
        socket.broadcast.emit("beginPath", arg);
    });
    socket.on("drawLine", (arg) => {
        socket.broadcast.emit("drawLine", arg);
    });
    socket.on("changeConfig", (arg) => {
        console.log(arg);
        socket.broadcast.emit("changeConfig", arg);
    });
});

httpServer.listen(4000);