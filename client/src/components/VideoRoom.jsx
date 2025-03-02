import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { Box, Text } from "@chakra-ui/react";
import { getRandomUsername } from "../utils/getRandomUser";

const socket = io("http://localhost:8080", { reconnection: true });

const VideoRoom = () => {
  let myname = ''
  const [mynamestate, setmyname] = useState(''); // Users in the room
  const { roomId } = useParams(); // Room ID from URL
  const [users, setUsers] = useState([]); // Users in the room
  const myVideo = useRef(); // Your own video ref
  const userVideos = useRef({}); // Mapping of peerId -> video ref
  const peersRef = useRef([]); // Array to keep track of peers
  const [stream, setStream] = useState(); // Your media stream

  useEffect(() => {
    myname = getRandomUsername();
    setmyname(myname)

    // Get user's video/audio stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
      setStream(currentStream);

      // Attach your own stream to your video element
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }

      // Notify the server that this user joined
      console.log("=========== User Emitting  ============", myname + " " + roomId + " " + socket.id)
      socket.emit("joinRoom", { roomId, userName: myname });

      socket.on("me", (id) => {
        console.log(id)
      })
      socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
      });
      socket.on("connect", () => {
        console.log("Connected to server with socket id:", socket.id);
      });
      // Listen for new users joining
      socket.on("userJoined", ({ userName, socketId }) => {
        console.log("=========== User Joined  ============", userName)
        const peer = createPeer(socketId, socket.id, currentStream);
        peersRef.current.push({ peerId: socketId, peer });
          setUsers((prevUsers) => {
            const userExists = prevUsers.some((user) => user.userName === userName);
            if (!userExists) {
              console.log("Adding user:", userName);
              return [...prevUsers, { userName, peerId: socketId }];
            }
            return prevUsers;
          });
      });

      // Handle receiving signal from existing users
      socket.on("receiveSignal", ({ signal, from, fromUsername }) => {
        const peer = addPeer(signal, from, currentStream);
        peersRef.current.push({ peerId: from, peer });
          setUsers((prevUsers) => {
            const userExists = prevUsers.some((user) => user.userName === fromUsername);
            if (!userExists) {
              console.log("Adding user:", fromUsername);
              return [...prevUsers, { userName: fromUsername, peerId: from }];
            }
            return prevUsers;
          });
      });
    });

    // Clean up when component unmounts

  }, [roomId]);

  useEffect(() => {

    return () => {
      stream?.getTracks().forEach(function(track) {
        track.stop();
      });
      socket.disconnect()
    }
  }, [])

  const createPeer = (userToSignal, callerId, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    // Send signal to other user
    peer.on("signal", (signal) => {
      socket.emit("sendSignal", { signal, to: userToSignal, fromUsername: myname });
    });

    // Handle stream from other user
    peer.on("stream", (remoteStream) => {
      console.log(userVideos)
      if (userVideos.current[userToSignal]) {
        userVideos.current[userToSignal].srcObject = remoteStream; // Attach stream to video element
      }
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerId, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream });

    // Send back signal to the caller
    peer.on("signal", (signal) => {
      socket.emit("sendSignal", { signal, to: callerId, fromUsername: myname });
    });

    // Handle stream from other user
    peer.on("stream", (remoteStream) => {
      console.log(userVideos)
      if (userVideos.current[callerId]) {
        userVideos.current[callerId].srcObject = remoteStream; // Attach stream to video element
      }
    });

    peer.signal(incomingSignal);
    return peer;
  };

  return (
    <Box>
      <Text fontSize="xl" mb={4}>
        Room ID: {roomId}
      </Text>
      <Box display="flex" flexDirection="column" gap={4}>
        {/* Your video */}
        <Box>
          <Text>Your Video: {mynamestate}</Text>
          <video playsInline ref={myVideo} autoPlay muted style={{ width: "300px" }} />
        </Box>

        {/* Other users' videos */}
        {users.map((user) => (
          <Box key={user.peerId}>
            <Text>{user.userName}</Text>
            <video
              playsInline
              ref={(el) => {
                userVideos.current[user.peerId] = el; // Store ref in userVideos
              }}
              autoPlay
              style={{ width: "300px" }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default VideoRoom;
