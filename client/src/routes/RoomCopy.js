import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import { jwtDecode } from "jwt-decode";
import micmute from "../assets/micmute.svg";
import micunmute from "../assets/micunmute.svg";
import webcam from "../assets/webcam.svg";
import webcamoff from "../assets/webcamoff.svg";
import endcall from "../assets/end-call-icon.svg";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { fetchUsers } from "../apis/authApis";
import { fetchAllUsersInRoom } from "../apis/roomApi";
import axios from "axios";

const Container = styled.div`
`;

const MainContainer = styled.div`
  height: 100vh;
  width: 100%;
`;

const Controls = styled.div`
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  filter: brightness(1);
  z-index: 1;
  border-radius: 6px;
  gap: 24px;
  display: flex;
  height: 68px;
  align-items: center;
  justify-content: center;
}
`;

const ControlSmall = styled.div`
  margin: 3px;
  padding: 5px;
  height: 16px;
  width: 98%;
  margin-top: -6vh;
  filter: brightness(1);
  z-index: 1;
  border-radius: 6px;
  display: flex;
  justify-content: center;
`;

const ImgComponent = styled.img`
  cursor: pointer;
  height: 40px;
  width: 40px;
`;

const ImgComponentSmall = styled.img`
  height: 15px;
  text-align: left;
  opacity: 0.5;
`;

const MyVideoContainer = styled.div`
    z-index: 2;
    bottom: 0;
    height: 130px;
    position: fixed;
    width: 200px;
`

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  border: 3px solid gray;
  background-color: black;
`;


const VideoGrid = styled.div`
  display: grid;
  width: 100vw;
  height: 80vh;
  gap: 10px;
  padding: 10px;
  grid-template-columns: ${({ count }) => `repeat(${count > 2 ? 2 : count}, 1fr)`};
  grid-template-rows: ${({ count }) => `repeat(${Math.ceil(count / 2)}, 1fr)`};
`;

const Video = (props) => {
  const ref = useRef();

  useEffect(() => {
    props.peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });
  }, []);

  return <StyledVideo playsInline autoPlay ref={ref} {...props} />;
};

const RoomCopy = (props) => {
  let isVideo = true;
  let userVideosArray = [];
  const [hasVideo, setHasVideo] = useState(true);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [peers, setPeers] = useState([]);
  const [usersInRoom, setUsersInRoom] = useState([]);
  const [audioFlag, setAudioFlag] = useState(true);
  const [videoFlag, setVideoFlag] = useState(true);
  const [userUpdate, setUserUpdate] = useState([]);
  const socketRef = useRef();
  const userVideo = useRef();
  const streamRef = useRef();
  const peersRef = useRef([]);
  const roomID = props.match.params.roomID;
  const videoConstraints = {
    minAspectRatio: 1.333,
    minFrameRate: 60,
    height: window.innerHeight / 1.8,
    width: window.innerWidth / 2,
  };
  async function getCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === "videoinput");
  }
  const fetchWeather = async (user) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${user?.city || "Islamabad"}&units=metric&appid=37e78c3096e576c4b3758d158358e03b`
      );
      if (response?.data?.main) {
        return { temp: response.data.main.temp, humidity: response.data.main.humidity }
      }
      return false;
    } catch (error) {
      return false;
    }
  };
  const fetchRoomUsers = async () => {
    const res = await fetchAllUsersInRoom(roomID);
    console.log(res)
    if (res && res.users) {
      setUsersInRoom(res.users);
    }
  }
  const fetchAllUser = async () => {
    const res = await fetchUsers();
    if (res && res.users) {
      let resUsers = JSON.parse(JSON.stringify(res.users));
      resUsers.forEach(async (user) => {
        let weather = await fetchWeather(user);
        if (weather) {
          user.temp = weather.temp;
          user.humidity = weather.humidity
        }
      })
      setUsers(resUsers);
    }
  }
  useEffect(() => {
    fetchRoomUsers();
  }, [peers])
  useEffect(() => {
    socketRef.current = io.connect("/");
    const token = localStorage.getItem("authTicket");

    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
        createStream(decodedUser);
      } catch (error) {
        console.error("Invalid token:", error);
        setUser(null);
      }

    }
    fetchAllUser();
    return () => {
      streamRef.current.getTracks().forEach(function (track) {
        track.stop();
      });
      socketRef.current.disconnect()
    }
  }, []);

  const getCanvasStream = (dUser) => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    function drawText() {
      // Clear canvas
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set text style
      ctx.font = "40px Arial";
      ctx.fillStyle = "red";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Draw username text
      ctx.fillText(dUser.username, canvas.width / 2, canvas.height / 2);
    }
    drawText();
    setInterval(drawText, 100);

    // Create a fake video stream from the canvas
    const stream = canvas.captureStream(30); // 30 FPS

    return stream;
  }
  const getAudioStream = async (dUser) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      return stream;

    } catch (err) {
      const canvasStream = getCanvasStream(dUser);
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create a new MediaStream and add video + audio tracks
      const finalStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);
      return finalStream;
    }
  }
  const getStream = async (dUser) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true });
      return stream;

    } catch (err) {
      isVideo = false;
      const stream = getAudioStream(dUser);
      return stream;
    }
  }

  const createStream = async (dUser) => {
    const cameraList = await getCameras()
    console.log(cameraList);
    const stream = await getStream(dUser);
    streamRef.current = stream
    userVideo.current.srcObject = stream;
    setHasVideo(isVideo)
    socketRef.current.emit("join room", { roomID, username: dUser.username, isVideo });
    socketRef.current.on("all users", (users) => {
      const peers = [];
      users.forEach((socketUser) => {
        let userID = socketUser.socketId;
        const peer = createPeer(userID, socketRef.current.id, stream);
        peersRef.current.push({
          peerID: userID,
          peer
        });
        let index = peers.findIndex((x) => x.peerID == userID);
        if (index == -1) {
          peers.push({
            peerID: userID,
            peer
          });
        }
      });
      setPeers(peers);
    });
    socketRef.current.on("user joined", (payload) => {
      const peer = addPeer(payload.signal, payload.callerID, stream);
      peersRef.current.push({
        peerID: payload.callerID,
        peer
      });
      const peerObj = {
        peer,
        peerID: payload.callerID
      };
      let index = peers.findIndex((x) => x.peerID == payload.callerID);
      if (index == -1) {
        setPeers((users) => [...users, peerObj]);
      }
    });

    socketRef.current.on("user left", (id) => {
      console.log("========== user left ===========")
      const peerObj = peersRef.current.find((p) => p.peerID === id);
      if (peerObj) {
        peerObj.peer.destroy();
      }
      const peers = peersRef.current.filter((p) => p.peerID !== id);
      peersRef.current = peers;
      setPeers(peers);
    });

    socketRef.current.on("receiving returned signal", (payload) => {
      const item = peersRef.current.find((p) => p.peerID === payload.id);
      item.peer.signal(payload.signal);
    });

    socketRef.current.on("change", (payload) => {
      console.log(payload)
      setUserUpdate(payload);
    });
  }

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("sending signal", {
        userToSignal,
        callerID,
        signal,
        roomID
      });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", { signal, callerID, roomID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const endCallClick = () => {
    streamRef.current.getTracks().forEach(function (track) {
      track.stop();
    });
    socketRef.current.disconnect();
    const userIndex = usersInRoom.findIndex((x) => x.username == user.username);
    if (userIndex > -1) {
      console.log(usersInRoom[userIndex])
      if(usersInRoom[userIndex].peer) {
        usersInRoom[userIndex].peer.destroy()
      }
    }
    props.history.push('/rooms')
  }

  const getVideoGrid = (newPeers) => {
    const uniquePeers = Array.from(
      new Map(newPeers.map((peer) => [peer.peerID, peer])).values()
    );
    return (
      <VideoGrid count={uniquePeers.length}>
        {newPeers.map((peer, index) => {
          if (index == 0) {
            userVideosArray = []
          }
          let audioFlagTemp = true;
          let videoFlagTemp = true;
          if (userUpdate) {
            userUpdate.forEach((entry) => {
              if (peer && peer.peerID && peer.peerID === entry.id) {
                audioFlagTemp = entry.audioFlag;
                videoFlagTemp = entry.videoFlag;
              }
            });
          }
          let videoIndex = userVideosArray.findIndex((x) => x == peer.peerID);
          if (videoIndex > -1) {
            return null;
          }

          const userIndex = usersInRoom.findIndex((x) => x.socketId == peer.peerID);
          console.log("================ user ===============")
          console.log(usersInRoom[userIndex])

          let userDetailIndex = -1
          if (userIndex > -1) {
            userDetailIndex = users.findIndex((x) => x.username == usersInRoom[userIndex].username)
          }

          userVideosArray.push(peer.peerID);
          return (
            <div style={{
              width: "100%",
              height: "100%",
              position: "relative",
              borderRadius: "10px",
              overflow: "hidden",
            }} id={peer.peerID} key={peer.peerID}>
              <div className="video-top-bar" style={{ position: "absolute", top: "0", background: "rgba(255,255,255,0.6)" }}>
                <span>{userDetailIndex > -1 ? users[userDetailIndex].username : "Unknown"}</span>
                <span>📌{userDetailIndex > -1 ? users[userDetailIndex].city : ''} </span>
                <span> 🌡️ {userDetailIndex > -1 ? users[userDetailIndex].temp : ''}°C </span>
                <span> 💧 {userDetailIndex > -1 ? users[userDetailIndex].humidity : ''}°C </span>
                <span></span>
              </div>
              <Video style={{ display: usersInRoom[userIndex] && usersInRoom[userIndex].isVideo ? "block" : "none" }} peer={peer.peer} />
              <div style={{ alignItems: "center", justifyContent: "center", height: "100%", width: "100%", backgroundColor: "black", color: "white", fontSize: "20px", fontWeight: "bold", display: usersInRoom[userIndex] && usersInRoom[userIndex].isVideo ? "none" : "flex" }}>Audio Only</div>
            </div>
          );
        })}
      </VideoGrid>
    )
  }

  return (
    <MainContainer>
      <Header {...props} />
      <Container>
        <MyVideoContainer >
          <StyledVideo style={{ display: hasVideo ? "block" : "none" }} muted ref={userVideo} autoPlay playsInline />
          <div style={{ alignItems: "center", justifyContent: "center", height: "100%", width: "100%", backgroundColor: "black", color: "white", fontSize: "20px", fontWeight: "bold", display: hasVideo ? "none" : "flex" }}>Audio Only</div>
        </MyVideoContainer>
        {peers.length > 0 ? getVideoGrid(peers) : <div style={{ display: 'flex', alignItems: "center", justifyContent: "center" }}><p>Waiting for participants...</p></div>}
        <Controls>
          <ImgComponent
            src={videoFlag ? webcam : webcamoff}
            onClick={() => {
              if (userVideo.current.srcObject) {
                userVideo.current.srcObject.getTracks().forEach(function (track) {
                  if (track.kind === "video") {
                    if (track.enabled) {
                      socketRef.current.emit("change", [...userUpdate, {
                        id: socketRef.current.id,
                        videoFlag: false,
                        audioFlag,
                      }]);
                      track.enabled = false;
                      setVideoFlag(false);
                    } else {
                      socketRef.current.emit("change", [...userUpdate, {
                        id: socketRef.current.id,
                        videoFlag: true,
                        audioFlag,
                      }]);
                      track.enabled = true;
                      setVideoFlag(true);
                    }
                  }
                });
              }
            }}
          />
          <ImgComponent
            src={audioFlag ? micunmute : micmute}
            onClick={() => {
              if (userVideo.current.srcObject) {
                userVideo.current.srcObject.getTracks().forEach(function (track) {
                  if (track.kind === "audio") {
                    if (track.enabled) {
                      socketRef.current.emit("change", [...userUpdate, {
                        id: socketRef.current.id,
                        videoFlag,
                        audioFlag: false,
                      }]);
                      track.enabled = false;
                      setAudioFlag(false);
                    } else {
                      socketRef.current.emit("change", [...userUpdate, {
                        id: socketRef.current.id,
                        videoFlag,
                        audioFlag: true,
                      }]);
                      track.enabled = true;
                      setAudioFlag(true);
                    }
                  }
                });
              }
            }}
          />
          <ImgComponent
            src={endcall}
            onClick={() => {
              endCallClick();
            }}
          />
        </Controls>
      </Container>
      <canvas id="canvas" width="640" height="480" style={{ display: "none" }}></canvas>
    </MainContainer>
  );
};

export default RoomCopy;
