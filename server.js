const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
require ("dotenv").config();
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
require("dotenv").config();

const users = {};
const socketToRoom = {};

app.use(express.json());

// Connect to MongoDB
connectDB();

io.on('connection', socket => {
    socket.on("join room", ({roomID, username, isVideo}) => {
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 9) {
                socket.emit("room full");
                return;
            }
            let index = users[roomID].findIndex((x) => x.username == username);
            if(index == -1) {
                users[roomID].push({socketId: socket.id, username, isVideo });
            } else {
                users[roomID][index].socketId = socket.id 
            }
            console.log(users[roomID])
        } else {
            users[roomID] = [{socketId: socket.id, username, isVideo}];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(x => x.socketId !== socket.id);
        socket.emit("all users", usersInThisRoom);
    });

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
        socket.broadcast.emit('user left',socket.id)
    });

    socket.on('change', (payload) => {
        socket.broadcast.emit('change',payload)
    });

});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.get("/api/room/:roomID", (req, res) => {
    return res.status(200).json({ users: users[ req.params.roomID ]});
})

// Default Route
// app.get("/", (req, res) => {
//     res.send("Welcome to the Audio/Video Chat Backend with PeerJS and Authentication");
// });

app.use( express.static(__dirname + '/client/frontend'));
app.get('*', (request, response) => {
    response.sendFile(path.join(__dirname, 'client/frontend/index.html'));
});
const PORT = process.env.PORT || 8000
// if(process.env.PROD){
// }

server.listen(process.env.PORT || 8000, () => console.log('server is running...'));


