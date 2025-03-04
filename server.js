/*const express = require("express");
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


const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const promClient = require("prom-client");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Prometheus Metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// WebRTC Metrics
const webrtcNetworkLatency = new promClient.Histogram({
  name: "webrtc_network_latency_seconds",
  help: "Measures WebRTC latency (RTT) in seconds",
  buckets: [0.1, 0.5, 1, 2, 5], // Latency buckets in seconds
});
register.registerMetric(webrtcNetworkLatency);

const webrtcPacketLoss = new promClient.Gauge({
  name: "webrtc_packet_loss_percentage",
  help: "Tracks packet loss percentage",
});
register.registerMetric(webrtcPacketLoss);

const webrtcJitter = new promClient.Gauge({
  name: "webrtc_jitter_seconds",
  help: "Tracks network jitter (variation in latency) in seconds",
});
register.registerMetric(webrtcJitter);

const webrtcBandwidthUsage = new promClient.Gauge({
  name: "webrtc_bandwidth_usage_kbps",
  help: "Measures bandwidth usage in kbps",
});
register.registerMetric(webrtcBandwidthUsage);

// Expose metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Connect to MongoDB
connectDB();

const users = {};
const socketToRoom = {};

app.use(express.json());

// Socket.IO Events
io.on("connection", (socket) => {
  console.log("🔗 New WebRTC connection:", socket.id);

  socket.on("join room", ({ roomID, username, isVideo }) => {
    if (users[roomID]) {
      const length = users[roomID].length;
      if (length === 9) {
        socket.emit("room full");
        return;
      }
      let index = users[roomID].findIndex((x) => x.username == username);
      if (index == -1) {
        users[roomID].push({ socketId: socket.id, username, isVideo });
      } else {
        users[roomID][index].socketId = socket.id;
      }
      console.log(users[roomID]);
    } else {
      users[roomID] = [{ socketId: socket.id, username, isVideo }];
    }
    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter((x) => x.socketId !== socket.id);
    socket.emit("all users", usersInThisRoom);
  });

  socket.on("sending signal", (payload) => {
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });

  socket.on("returning signal", (payload) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  // Handle WebRTC network stats
  socket.on("webrtc_stats", ({ latency, packetLoss, jitter, bandwidth }) => {
    console.log("Received WebRTC Stats:", { latency, packetLoss, jitter, bandwidth }); // Debugging

    // Update Prometheus metrics
    webrtcNetworkLatency.observe(latency); // Latency in seconds
    webrtcPacketLoss.set(packetLoss);     // Packet loss percentage
    webrtcJitter.set(jitter);             // Jitter in seconds
    webrtcBandwidthUsage.set(bandwidth);  // Bandwidth usage in kbps
  });

  socket.on("disconnect", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }
    socket.broadcast.emit("user left", socket.id);
  });

  socket.on("change", (payload) => {
    socket.broadcast.emit("change", payload);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.get("/api/room/:roomID", (req, res) => {
  return res.status(200).json({ users: users[req.params.roomID] });
});

// Serve static files from the React app's build directory
app.use(express.static(path.join(__dirname, "client", "frontend")));

// Handle React routing, return all requests to React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "frontend", "index.html"));
});

// Start Server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(` Server running on port ${PORT}, Prometheus at /metrics`));
*/

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const promClient = require("prom-client");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Prometheus Metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// WebRTC Metrics
const webrtcNetworkLatency = new promClient.Histogram({
  name: "webrtc_network_latency_seconds",
  help: "Measures WebRTC latency (RTT) in seconds",
  buckets: [0.1, 0.5, 1, 2, 5], // Latency buckets in seconds
});
register.registerMetric(webrtcNetworkLatency);

const webrtcPacketLoss = new promClient.Gauge({
  name: "webrtc_packet_loss_percentage",
  help: "Tracks packet loss percentage",
});
register.registerMetric(webrtcPacketLoss);

const webrtcJitter = new promClient.Gauge({
  name: "webrtc_jitter_seconds",
  help: "Tracks network jitter (variation in latency) in seconds",
});
register.registerMetric(webrtcJitter);

const webrtcBandwidthUsage = new promClient.Gauge({
  name: "webrtc_bandwidth_usage_kbps",
  help: "Measures bandwidth usage in kbps",
});
register.registerMetric(webrtcBandwidthUsage);

// Expose metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Connect to MongoDB
connectDB();

const users = {};
const socketToRoom = {};

app.use(express.json());

// Socket.IO Events
io.on("connection", (socket) => {
  console.log("🔗 New WebRTC connection:", socket.id);

  socket.on("join room", ({ roomID, username, isVideo }) => {
    if (users[roomID]) {
      const length = users[roomID].length;
      if (length === 9) {
        socket.emit("room full");
        return;
      }
      let index = users[roomID].findIndex((x) => x.username == username);
      if (index == -1) {
        users[roomID].push({ socketId: socket.id, username, isVideo });
      } else {
        users[roomID][index].socketId = socket.id;
      }
      console.log(users[roomID]);
    } else {
      users[roomID] = [{ socketId: socket.id, username, isVideo }];
    }
    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter((x) => x.socketId !== socket.id);
    socket.emit("all users", usersInThisRoom);
  });

  socket.on("sending signal", (payload) => {
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });

  socket.on("returning signal", (payload) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  // Handle WebRTC network stats
  socket.on("webrtc_stats", ({ latency, packetLoss, jitter, bandwidth }) => {
    console.log("Received WebRTC Stats:", { latency, packetLoss, jitter, bandwidth }); // Debugging

    // Update Prometheus metrics
    webrtcNetworkLatency.observe(latency); // Latency in seconds
    webrtcPacketLoss.set(packetLoss);     // Packet loss percentage
    webrtcJitter.set(jitter);             // Jitter in seconds
    webrtcBandwidthUsage.set(bandwidth);  // Bandwidth usage in kbps
  });

  socket.on("disconnect", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }
    socket.broadcast.emit("user left", socket.id);
  });

  socket.on("change", (payload) => {
    socket.broadcast.emit("change", payload);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.get("/api/room/:roomID", (req, res) => {
  return res.status(200).json({ users: users[req.params.roomID] });
});

// Serve static files from the React app's build directory
app.use(express.static(path.join(__dirname, "client", "frontend")));

// Handle React routing, return all requests to React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "frontend", "index.html"));
});

// Start Server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}, Prometheus at /metrics`));