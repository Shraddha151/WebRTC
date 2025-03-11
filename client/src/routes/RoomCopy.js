/*import React, { useEffect, useRef, useState } from "react";
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

const Container = styled.div``;

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

const MyVideoContainer = styled.div`
  z-index: 2;
  bottom: 0;
  height: 130px;
  position: fixed;
  width: 200px;
`;

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
  }, [props.peer]);

  return <StyledVideo playsInline autoPlay ref={ref} />;
};

const RoomCopy = (props) => {
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
    return devices.filter((device) => device.kind === "videoinput");
  }

  const fetchWeather = async (user) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${user?.city || "Islamabad"}&units=metric&appid=37e78c3096e576c4b3758d158358e03b`
      );
      if (response?.data?.main) {
        return { temp: response.data.main.temp, humidity: response.data.main.humidity };
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const fetchRoomUsers = async () => {
    const res = await fetchAllUsersInRoom(roomID);
    console.log("Room Users:", res);
    if (res && res.users) {
      setUsersInRoom(res.users);
    }
  };

  const fetchAllUser = async () => {
    const res = await fetchUsers();
    if (res && res.users) {
      let resUsers = JSON.parse(JSON.stringify(res.users));
      resUsers.forEach(async (user) => {
        let weather = await fetchWeather(user);
        if (weather) {
          user.temp = weather.temp;
          user.humidity = weather.humidity;
        }
      });
      setUsers(resUsers);
    }
  };

  useEffect(() => {
    fetchRoomUsers();
  }, [peers]);

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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      socketRef.current.disconnect();
    };
  }, []);

  async function createStream(dUser) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true })
      .catch(async (err) => {
        // Fallback if video is not available
        return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      });
    streamRef.current = stream;
    userVideo.current.srcObject = stream;
    setHasVideo(true);
    socketRef.current.emit("join room", { roomID, username: dUser.username, isVideo: true });

    socketRef.current.on("all users", (users) => {
      const peersArr = [];
      users.forEach((socketUser) => {
        const userID = socketUser.socketId;
        const peer = createPeer(userID, socketRef.current.id, stream);
        peersRef.current.push({ peerID: userID, peer });
        peersArr.push({ peerID: userID, peer });
      });
      setPeers(peersArr);
    });

    socketRef.current.on("user joined", (payload) => {
      const peer = addPeer(payload.signal, payload.callerID, stream);
      peersRef.current.push({ peerID: payload.callerID, peer });
      setPeers((prev) => [...prev, { peer, peerID: payload.callerID }]);
    });

    socketRef.current.on("user left", (id) => {
      console.log("User left:", id);
      const peerObj = peersRef.current.find((p) => p.peerID === id);
      if (peerObj) {
        peerObj.peer.destroy();
      }
      peersRef.current = peersRef.current.filter((p) => p.peerID !== id);
      setPeers([...peersRef.current]);
    });

    socketRef.current.on("receiving returned signal", (payload) => {
      const item = peersRef.current.find((p) => p.peerID === payload.id);
      if (item) item.peer.signal(payload.signal);
    });

    socketRef.current.on("change", (payload) => {
      console.log("Received change:", payload);
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
      socketRef.current.emit("sending signal", { userToSignal, callerID, signal, roomID });
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

  // Periodic WebRTC Stats Collection: polls every 5 seconds
  useEffect(() => {
    const statsInterval = setInterval(() => {
      peersRef.current.forEach((peerObj) => {
        if (peerObj.peer && peerObj.peer._pc) {
          peerObj.peer._pc.getStats(null).then((statsReport) => {
            let latency = 0;
            let packetLoss = 0;
            let jitter = 0;
            let bandwidth = 0; // Placeholder if you want to compute bandwidth

            statsReport.forEach((report) => {
              if (report.type === "candidate-pair" && report.state === "succeeded") {
                latency = report.currentRoundTripTime || 0;
              }
              if (report.type === "inbound-rtp" && !report.isRemote) {
                const lost = report.packetsLost || 0;
                const received = report.packetsReceived || 1; // avoid division by zero
                packetLoss = (lost / (lost + received)) * 100;
                jitter = report.jitter || 0;
              }
            });

            if (socketRef.current) {
              socketRef.current.emit("webrtc_stats", { latency, packetLoss, jitter, bandwidth });
              console.log("Emitting WebRTC Stats:", { latency, packetLoss, jitter, bandwidth });
            }
          }).catch((error) => console.error("Error collecting WebRTC stats:", error));
        }
      });
    }, 5000);

    return () => clearInterval(statsInterval);
  }, []);

  const endCallClick = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    socketRef.current.disconnect();
    props.history.push('/rooms');
  };

  const getVideoGrid = (newPeers) => {
    const uniquePeers = Array.from(new Map(newPeers.map((peer) => [peer.peerID, peer])).values());
    return (
      <VideoGrid count={uniquePeers.length}>
        {uniquePeers.map((peer) => {
          return (
            <div
              id={peer.peerID}
              key={peer.peerID}
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  background: "rgba(255,255,255,0.6)",
                }}
              >
                {peer.peerID}
              </div>
              <Video peer={peer.peer} />
            </div>
          );
        })}
      </VideoGrid>
    );
  };

  return (
    <MainContainer>
      <Header {...props} />
      <Container>
        <MyVideoContainer>
          <StyledVideo style={{ display: hasVideo ? "block" : "none" }} muted ref={userVideo} autoPlay playsInline />
          <div
            style={{
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              width: "100%",
              backgroundColor: "black",
              color: "white",
              fontSize: "20px",
              fontWeight: "bold",
              display: hasVideo ? "none" : "flex",
            }}
          >
            Audio Only
          </div>
        </MyVideoContainer>
        {peers.length > 0 ? getVideoGrid(peers) : <div style={{ display: 'flex', alignItems: "center", justifyContent: "center" }}><p>Waiting for participants...</p></div>}
        <Controls>
          <ImgComponent
            src={videoFlag ? webcam : webcamoff}
            onClick={() => {
              if (userVideo.current.srcObject) {
                userVideo.current.srcObject.getTracks().forEach((track) => {
                  if (track.kind === "video") {
                    if (track.enabled) {
                      socketRef.current.emit("change", [...userUpdate, { id: socketRef.current.id, videoFlag: false, audioFlag }]);
                      track.enabled = false;
                      setVideoFlag(false);
                    } else {
                      socketRef.current.emit("change", [...userUpdate, { id: socketRef.current.id, videoFlag: true, audioFlag }]);
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
                userVideo.current.srcObject.getTracks().forEach((track) => {
                  if (track.kind === "audio") {
                    if (track.enabled) {
                      socketRef.current.emit("change", [...userUpdate, { id: socketRef.current.id, videoFlag, audioFlag: false }]);
                      track.enabled = false;
                      setAudioFlag(false);
                    } else {
                      socketRef.current.emit("change", [...userUpdate, { id: socketRef.current.id, videoFlag, audioFlag: true }]);
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
            onClick={endCallClick}
          />
        </Controls>
      </Container>
      <Footer />
      <canvas id="canvas" width="640" height="480" style={{ display: "none" }}></canvas>
    </MainContainer>
  );
};

export default RoomCopy;


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

const Container = styled.div``;

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

const MyVideoContainer = styled.div`
  z-index: 2;
  bottom: 0;
  height: 130px;
  position: fixed;
  width: 200px;
`;

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
  }, [props.peer]);
  return <StyledVideo playsInline autoPlay ref={ref} />;
};

const RoomCopy = (props) => {
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
    return devices.filter((device) => device.kind === "videoinput");
  }

  const fetchWeather = async (user) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${user?.city || "Islamabad"}&units=metric&appid=37e78c3096e576c4b3758d158358e03b`
      );
      if (response?.data?.main) {
        return { temp: response.data.main.temp, humidity: response.data.main.humidity };
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const fetchRoomUsers = async () => {
    const res = await fetchAllUsersInRoom(roomID);
    console.log("Room Users:", res);
    if (res && res.users) {
      setUsersInRoom(res.users);
    }
  };

  const fetchAllUser = async () => {
    const res = await fetchUsers();
    if (res && res.users) {
      let resUsers = JSON.parse(JSON.stringify(res.users));
      resUsers.forEach(async (user) => {
        let weather = await fetchWeather(user);
        if (weather) {
          user.temp = weather.temp;
          user.humidity = weather.humidity;
        }
      });
      setUsers(resUsers);
    }
  };

  useEffect(() => {
    fetchRoomUsers();
  }, [peers]);

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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      socketRef.current.disconnect();
    };
  }, []);

  async function createStream(dUser) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true })
      .catch(async (err) => {
        // Fallback if video is not available
        return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      });
    streamRef.current = stream;
    userVideo.current.srcObject = stream;
    setHasVideo(true);
    socketRef.current.emit("join room", { roomID, username: dUser.username, isVideo: true });

    socketRef.current.on("all users", (users) => {
      const peersArr = [];
      users.forEach((socketUser) => {
        const userID = socketUser.socketId;
        const peer = createPeer(userID, socketRef.current.id, stream);
        peersRef.current.push({ peerID: userID, peer });
        peersArr.push({ peerID: userID, peer });
      });
      setPeers(peersArr);
    });

    socketRef.current.on("user joined", (payload) => {
      const peer = addPeer(payload.signal, payload.callerID, stream);
      peersRef.current.push({ peerID: payload.callerID, peer });
      setPeers((prev) => [...prev, { peer, peerID: payload.callerID }]);
    });

    socketRef.current.on("user left", (id) => {
      console.log("User left:", id);
      const peerObj = peersRef.current.find((p) => p.peerID === id);
      if (peerObj) {
        peerObj.peer.destroy();
      }
      peersRef.current = peersRef.current.filter((p) => p.peerID !== id);
      setPeers([...peersRef.current]);
    });

    socketRef.current.on("receiving returned signal", (payload) => {
      const item = peersRef.current.find((p) => p.peerID === payload.id);
      if (item) item.peer.signal(payload.signal);
    });

    socketRef.current.on("change", (payload) => {
      console.log("Received change:", payload);
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
      socketRef.current.emit("sending signal", { userToSignal, callerID, signal, roomID });
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

  // Periodic WebRTC Stats Collection: polls every 5 seconds
  useEffect(() => {
    const statsInterval = setInterval(() => {
      peersRef.current.forEach((peerObj) => {
        if (peerObj.peer && peerObj.peer._pc) {
          peerObj.peer._pc.getStats(null)
            .then((statsReport) => {
              // Debug: Log the entire stats report
              statsReport.forEach((report) => {
                console.log("Stats report:", report);
              });
              let latency = 0;
              let packetLoss = 0;
              let jitter = 0;
              let bandwidth = 0; // Placeholder for bandwidth computation

              statsReport.forEach((report) => {
                if (report.type === "candidate-pair" && report.state === "succeeded") {
                  latency = report.currentRoundTripTime || 0;
                }
                if (report.type === "inbound-rtp" && !report.isRemote) {
                  const lost = report.packetsLost || 0;
                  const received = report.packetsReceived || 1; // Avoid division by zero
                  packetLoss = (lost / (lost + received)) * 100;
                  jitter = report.jitter || 0;
                }
              });

              if (socketRef.current) {
                socketRef.current.emit("webrtc_stats", { latency, packetLoss, jitter, bandwidth });
                console.log("Emitting WebRTC Stats:", { latency, packetLoss, jitter, bandwidth });
              }
            })
            .catch((error) => console.error("Error collecting WebRTC stats:", error));
        }
      });
    }, 5000);

    return () => clearInterval(statsInterval);
  }, []);

  const endCallClick = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    socketRef.current.disconnect();
    props.history.push("/rooms");
  };

  const getVideoGrid = (newPeers) => {
    const uniquePeers = Array.from(new Map(newPeers.map((peer) => [peer.peerID, peer])).values());
    return (
      <VideoGrid count={uniquePeers.length}>
        {uniquePeers.map((peer) => (
          <div
            id={peer.peerID}
            key={peer.peerID}
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "0",
                background: "rgba(255,255,255,0.6)",
              }}
            >
              {peer.peerID}
            </div>
            <Video peer={peer.peer} />
          </div>
        ))}
      </VideoGrid>
    );
  };

  return (
    <MainContainer>
      <Header {...props} />
      <Container>
        <MyVideoContainer>
          <StyledVideo
            style={{ display: hasVideo ? "block" : "none" }}
            muted
            ref={userVideo}
            autoPlay
            playsInline
          />
          <div
            style={{
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              width: "100%",
              backgroundColor: "black",
              color: "white",
              fontSize: "20px",
              fontWeight: "bold",
              display: hasVideo ? "none" : "flex",
            }}
          >
            Audio Only
          </div>
        </MyVideoContainer>
        {peers.length > 0 ? (
          getVideoGrid(peers)
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p>Waiting for participants...</p>
          </div>
        )}
        <Controls>
          <ImgComponent
            src={videoFlag ? webcam : webcamoff}
            onClick={() => {
              if (userVideo.current.srcObject) {
                userVideo.current.srcObject.getTracks().forEach((track) => {
                  if (track.kind === "video") {
                    if (track.enabled) {
                      socketRef.current.emit("change", [
                        ...userUpdate,
                        { id: socketRef.current.id, videoFlag: false, audioFlag },
                      ]);
                      track.enabled = false;
                      setVideoFlag(false);
                    } else {
                      socketRef.current.emit("change", [
                        ...userUpdate,
                        { id: socketRef.current.id, videoFlag: true, audioFlag },
                      ]);
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
                userVideo.current.srcObject.getTracks().forEach((track) => {
                  if (track.kind === "audio") {
                    if (track.enabled) {
                      socketRef.current.emit("change", [
                        ...userUpdate,
                        { id: socketRef.current.id, videoFlag, audioFlag: false },
                      ]);
                      track.enabled = false;
                      setAudioFlag(false);
                    } else {
                      socketRef.current.emit("change", [
                        ...userUpdate,
                        { id: socketRef.current.id, videoFlag, audioFlag: true },
                      ]);
                      track.enabled = true;
                      setAudioFlag(true);
                    }
                  }
                });
              }
            }}
          />
          <ImgComponent src={endcall} onClick={endCallClick} />
        </Controls>
      </Container>
      <Footer />
      <canvas id="canvas" width="640" height="480" style={{ display: "none" }}></canvas>
    </MainContainer>
  );
};

export default RoomCopy;


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

const Container = styled.div``;

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

const MyVideoContainer = styled.div`
  z-index: 2;
  bottom: 0;
  height: 130px;
  position: fixed;
  width: 200px;
`;

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
  }, [props.peer]);
  return <StyledVideo playsInline autoPlay ref={ref} />;
};

const RoomCopy = (props) => {
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
    return devices.filter((device) => device.kind === "videoinput");
  }

  const fetchWeather = async (user) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${user?.city || "Bengaluru"}&units=metric&appid=37e78c3096e576c4b3758d158358e03b`
      );
      if (response?.data?.main) {
        return { temp: response.data.main.temp, humidity: response.data.main.humidity };
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const fetchRoomUsers = async () => {
    const res = await fetchAllUsersInRoom(roomID);
    console.log("Room Users:", res);
    if (res && res.users) {
      setUsersInRoom(res.users);
    }
  };

  const fetchAllUser = async () => {
    const res = await fetchUsers();
    if (res && res.users) {
      let resUsers = JSON.parse(JSON.stringify(res.users));
      resUsers.forEach(async (user) => {
        let weather = await fetchWeather(user);
        if (weather) {
          user.temp = weather.temp;
          user.humidity = weather.humidity;
        }
      });
      setUsers(resUsers);
    }
  };

  useEffect(() => {
    fetchRoomUsers();
  }, [peers]);

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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      socketRef.current.disconnect();
    };
  }, []);

  async function createStream(dUser) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true })
      .catch(async (err) => {
        // Fallback if video is not available
        return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      });
    streamRef.current = stream;
    userVideo.current.srcObject = stream;
    setHasVideo(true);
    socketRef.current.emit("join room", { roomID, username: dUser.username, isVideo: true });

    socketRef.current.on("all users", (users) => {
      const peersArr = [];
      users.forEach((socketUser) => {
        const userID = socketUser.socketId;
        const peer = createPeer(userID, socketRef.current.id, stream);
        peersRef.current.push({ peerID: userID, peer });
        peersArr.push({ peerID: userID, peer });
      });
      setPeers(peersArr);
    });

    socketRef.current.on("user joined", (payload) => {
      const peer = addPeer(payload.signal, payload.callerID, stream);
      peersRef.current.push({ peerID: payload.callerID, peer });
      setPeers((prev) => [...prev, { peer, peerID: payload.callerID }]);
    });

    socketRef.current.on("user left", (id) => {
      console.log("User left:", id);
      const peerObj = peersRef.current.find((p) => p.peerID === id);
      if (peerObj) {
        peerObj.peer.destroy();
      }
      peersRef.current = peersRef.current.filter((p) => p.peerID !== id);
      setPeers([...peersRef.current]);
    });

    socketRef.current.on("receiving returned signal", (payload) => {
      const item = peersRef.current.find((p) => p.peerID === payload.id);
      if (item) item.peer.signal(payload.signal);
    });

    socketRef.current.on("change", (payload) => {
      console.log("Received change:", payload);
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
      socketRef.current.emit("sending signal", { userToSignal, callerID, signal, roomID });
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

  // Periodic WebRTC Stats Collection: polls every 5 seconds
  useEffect(() => {
    const statsInterval = setInterval(() => {
      peersRef.current.forEach((peerObj) => {
        if (peerObj.peer && peerObj.peer._pc) {
          peerObj.peer._pc.getStats(null)
            .then((statsReport) => {
              let latency = 0;
              let packetLoss = 0;
              let jitter = 0;
              let bandwidth = 0;
              let previousBytesReceived = 0;
              let previousTimestamp = 0;

              statsReport.forEach((report) => {
                if (report.type === "candidate-pair" && report.state === "succeeded") {
                  latency = report.currentRoundTripTime || 0;
                }
                if (report.type === "inbound-rtp" && !report.isRemote) {
                  const lost = report.packetsLost || 0;
                  const received = report.packetsReceived || 1; // Avoid division by zero
                  packetLoss = (lost / (lost + received)) * 100;
                  jitter = report.jitter || 0;

                  const bytesReceived = report.bytesReceived || 0;
                  const timestamp = report.timestamp || 0;

                  if (previousBytesReceived > 0 && previousTimestamp > 0) {
                    const bytesDiff = bytesReceived - previousBytesReceived;
                    const timeDiff = timestamp - previousTimestamp;
                    bandwidth = (bytesDiff * 8) / (timeDiff / 1000); // Convert to kbps
                  }

                  previousBytesReceived = bytesReceived;
                  previousTimestamp = timestamp;
                }
              });

              if (socketRef.current) {
                try {
                  socketRef.current.emit("webrtc_stats", { latency, packetLoss, jitter, bandwidth });
                  console.log("Emitting WebRTC Stats:", { latency, packetLoss, jitter, bandwidth });
                } catch (error) {
                  console.error("Error emitting WebRTC stats:", error);
                }
              }
            })
            .catch((error) => console.error("Error collecting WebRTC stats:", error));
        }
      });
    }, 5000);

    return () => clearInterval(statsInterval);
  }, []);

  const endCallClick = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    socketRef.current.disconnect();
    props.history.push("/rooms");
  };

  const getVideoGrid = (newPeers) => {
    const uniquePeers = Array.from(new Map(newPeers.map((peer) => [peer.peerID, peer])).values());
    return (
      <VideoGrid count={uniquePeers.length}>
        {uniquePeers.map((peer) => (
          <div
            id={peer.peerID}
            key={peer.peerID}
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "0",
                background: "rgba(255,255,255,0.6)",
              }}
            >
              {peer.peerID}
            </div>
            <Video peer={peer.peer} />
          </div>
        ))}
      </VideoGrid>
    );
  };

  return (
    <MainContainer>
      <Header {...props} />
      <Container>
        <MyVideoContainer>
          <StyledVideo
            style={{ display: hasVideo ? "block" : "none" }}
            muted
            ref={userVideo}
            autoPlay
            playsInline
          />
          <div
            style={{
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              width: "100%",
              backgroundColor: "black",
              color: "white",
              fontSize: "20px",
              fontWeight: "bold",
              display: hasVideo ? "none" : "flex",
            }}
          >
            Audio Only
          </div>
        </MyVideoContainer>
        {peers.length > 0 ? (
          getVideoGrid(peers)
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p>Waiting for participants...</p>
          </div>
        )}
        <Controls>
          <ImgComponent
            src={videoFlag ? webcam : webcamoff}
            onClick={() => {
              if (userVideo.current.srcObject) {
                userVideo.current.srcObject.getTracks().forEach((track) => {
                  if (track.kind === "video") {
                    if (track.enabled) {
                      socketRef.current.emit("change", [
                        ...userUpdate,
                        { id: socketRef.current.id, videoFlag: false, audioFlag },
                      ]);
                      track.enabled = false;
                      setVideoFlag(false);
                    } else {
                      socketRef.current.emit("change", [
                        ...userUpdate,
                        { id: socketRef.current.id, videoFlag: true, audioFlag },
                      ]);
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
                userVideo.current.srcObject.getTracks().forEach((track) => {
                  if (track.kind === "audio") {
                    if (track.enabled) {
                      socketRef.current.emit("change", [
                        ...userUpdate,
                        { id: socketRef.current.id, videoFlag, audioFlag: false },
                      ]);
                      track.enabled = false;
                      setAudioFlag(false);
                    } else {
                      socketRef.current.emit("change", [
                        ...userUpdate,
                        { id: socketRef.current.id, videoFlag, audioFlag: true },
                      ]);
                      track.enabled = true;
                      setAudioFlag(true);
                    }
                  }
                });
              }
            }}
          />
          <ImgComponent src={endcall} onClick={endCallClick} />
        </Controls>
      </Container>
      <Footer />
      <canvas id="canvas" width="640" height="480" style={{ display: "none" }}></canvas>
    </MainContainer>
  );
};

export default RoomCopy;
*/

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

const Container = styled.div``;

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
`;

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

/**
 * Video Component
 * ----------------
 * Renders a video element for a given peer's stream.
 * Logs mounting, stream events, polling for stats, and calculated metrics.
 * Emits "webrtc_stats" to the server via the provided socket.
 */
const Video = ({ peer, socket, ...props }) => {
  const ref = useRef();

  useEffect(() => {
    console.log("[Video] Mounted for peer:", peer);

    // Attach the remote stream to the video element.
    peer.on("stream", (stream) => {
      console.log("[Video] Received remote stream for peer:", peer, stream);
      ref.current.srcObject = stream;
    });

    // Poll for network metrics every 5 seconds.
    const interval = setInterval(() => {
      if (peer && peer._pc) {
        console.log("[Video] Polling stats for peer:", peer);
        peer._pc.getStats(null)
          .then((stats) => {
            let rtt = 0;
            let packetLoss = 0;
            let jitter = 0;
            let bandwidth = 0;
            // Iterate over all stats reports.
            stats.forEach((report) => {
              // For RTT, use the candidate-pair that is selected.
              if (report.type === "candidate-pair" && report.selected && report.currentRoundTripTime) {
                rtt = report.currentRoundTripTime; // in seconds
                console.log("[Video] Candidate-pair report:", report);
              }
              // If needed, add parsing for inbound/outbound-rtp for packet loss, jitter, etc.
            });
            console.log("[Video] Calculated RTT for peer:", peer, "RTT:", rtt);
            if (socket) {
              socket.emit("webrtc_stats", {
                latency: rtt,
                packetLoss,
                jitter,
                bandwidth,
              });
              console.log("[Video] Emitted webrtc_stats for peer:", peer, {
                latency: rtt,
                packetLoss,
                jitter,
                bandwidth,
              });
            }
          })
          .catch((error) => {
            console.error("[Video] Error retrieving stats for peer:", peer, error);
          });
      } else {
        console.log("[Video] peer._pc not available yet for peer:", peer);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      console.log("[Video] Unmounted for peer:", peer);
    };
  }, [peer, socket]);

  return <StyledVideo playsInline autoPlay ref={ref} {...props} />;
};

const RoomCopy = (props) => {
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

  // Enumerate available cameras.
  async function getCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameraList = devices.filter((device) => device.kind === "videoinput");
    console.log("[RoomCopy] Available cameras:", cameraList);
    return cameraList;
  }

  // Fetch weather data for a user.
  const fetchWeather = async (user) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${user?.city || "Islamabad"}&units=metric&appid=37e78c3096e576c4b3758d158358e03b`
      );
      if (response?.data?.main) {
        return { temp: response.data.main.temp, humidity: response.data.main.humidity };
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Fetch users in the current room.
  const fetchRoomUsers = async () => {
    const res = await fetchAllUsersInRoom(roomID);
    console.log("[RoomCopy] Users in room from API:", res);
    if (res && res.users) {
      setUsersInRoom(res.users);
    }
  };

  // Fetch all users and attach weather data.
  const fetchAllUser = async () => {
    const res = await fetchUsers();
    if (res && res.users) {
      let resUsers = JSON.parse(JSON.stringify(res.users));
      for (let user of resUsers) {
        let weather = await fetchWeather(user);
        if (weather) {
          user.temp = weather.temp;
          user.humidity = weather.humidity;
        }
      }
      console.log("[RoomCopy] All users with weather data:", resUsers);
      setUsers(resUsers);
    }
  };

  useEffect(() => {
    fetchRoomUsers();
  }, [peers]);

  useEffect(() => {
    console.log("[RoomCopy] Initializing socket connection...");
    socketRef.current = io.connect("/");
    const token = localStorage.getItem("authTicket");

    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        console.log("[RoomCopy] Decoded user:", decodedUser);
        setUser(decodedUser);
        createStream(decodedUser);
      } catch (error) {
        console.error("[RoomCopy] Invalid token:", error);
        setUser(null);
      }
    }
    fetchAllUser();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      socketRef.current.disconnect();
    };
  }, []);

  // Create a fallback video stream from a canvas.
  const getCanvasStream = (dUser) => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    function drawText() {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = "40px Arial";
      ctx.fillStyle = "red";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(dUser.username, canvas.width / 2, canvas.height / 2);
    }
    drawText();
    setInterval(drawText, 100);
    const stream = canvas.captureStream(30);
    return stream;
  };

  // Fallback to audio-only if video is unavailable.
  const getAudioStream = async (dUser) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      return stream;
    } catch (err) {
      const canvasStream = getCanvasStream(dUser);
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const finalStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);
      return finalStream;
    }
  };

  // Attempt to get full video+audio stream; fallback if necessary.
  const getStream = async (dUser) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true,
      });
      return stream;
    } catch (err) {
      isVideo = false;
      const stream = await getAudioStream(dUser);
      return stream;
    }
  };

  // Create local stream and set up Socket.IO event listeners.
  const createStream = async (dUser) => {
    const cameraList = await getCameras();
    console.log("[RoomCopy] Camera list:", cameraList);
    const stream = await getStream(dUser);
    console.log("[RoomCopy] Local stream obtained:", stream);
    streamRef.current = stream;
    userVideo.current.srcObject = stream;
    setHasVideo(isVideo);
    console.log(`[RoomCopy] Joining room: ${roomID} as ${dUser.username}`);
    socketRef.current.emit("join room", { roomID, username: dUser.username, isVideo });
    socketRef.current.on("all users", (users) => {
      console.log("[RoomCopy] All users in room:", users);
      const newPeers = [];
      users.forEach((socketUser) => {
        let userID = socketUser.socketId;
        const peer = createPeer(userID, socketRef.current.id, stream);
        peersRef.current.push({ peerID: userID, peer });
        if (newPeers.findIndex((x) => x.peerID === userID) === -1) {
          newPeers.push({ peerID: userID, peer });
        }
      });
      setPeers(newPeers);
    });
    socketRef.current.on("user joined", (payload) => {
      console.log("[RoomCopy] User joined:", payload);
      const peer = addPeer(payload.signal, payload.callerID, stream);
      peersRef.current.push({ peerID: payload.callerID, peer });
      const peerObj = { peer, peerID: payload.callerID };
      if (peers.findIndex((x) => x.peerID === payload.callerID) === -1) {
        setPeers((prevPeers) => [...prevPeers, peerObj]);
      }
    });
    socketRef.current.on("user left", (id) => {
      console.log("[RoomCopy] User left:", id);
      const peerObj = peersRef.current.find((p) => p.peerID === id);
      if (peerObj) {
        peerObj.peer.destroy();
      }
      const remainingPeers = peersRef.current.filter((p) => p.peerID !== id);
      peersRef.current = remainingPeers;
      setPeers(remainingPeers);
    });
    socketRef.current.on("receiving returned signal", (payload) => {
      console.log("[RoomCopy] Receiving returned signal:", payload);
      const item = peersRef.current.find((p) => p.peerID === payload.id);
      if (item) {
        item.peer.signal(payload.signal);
      }
    });
    socketRef.current.on("change", (payload) => {
      console.log("[RoomCopy] Received 'change' event:", payload);
      setUserUpdate(payload);
    });
  };

  // Create a new Peer (initiator)
  function createPeer(userToSignal, callerID, stream) {
    console.log(`[RoomCopy] Creating peer: callerID=${callerID}, userToSignal=${userToSignal}`);
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });
    peer.on("signal", (signal) => {
      console.log("[RoomCopy] Peer initiator signal:", signal);
      socketRef.current.emit("sending signal", { userToSignal, callerID, signal, roomID });
    });
    return peer;
  }

  // Add a Peer (non-initiator)
  function addPeer(incomingSignal, callerID, stream) {
    console.log(`[RoomCopy] Adding peer: callerID=${callerID}`);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });
    peer.on("signal", (signal) => {
      console.log("[RoomCopy] Peer non-initiator signal:", signal);
      socketRef.current.emit("returning signal", { signal, callerID, roomID });
    });
    peer.signal(incomingSignal);
    return peer;
  }

  // End call and navigate away.
  const endCallClick = () => {
    console.log("[RoomCopy] Ending call");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    socketRef.current.disconnect();
    const userIndex = usersInRoom.findIndex((x) => x.username === user.username);
    if (userIndex > -1 && usersInRoom[userIndex].peer) {
      usersInRoom[userIndex].peer.destroy();
    }
    props.history.push("/rooms");
  };

  // Render the video grid.
  const getVideoGrid = (newPeers) => {
    const uniquePeers = Array.from(new Map(newPeers.map((p) => [p.peerID, p])).values());
    console.log("[RoomCopy] getVideoGrid rendering with peers:", uniquePeers);
    return (
      <VideoGrid count={uniquePeers.length}>
        {uniquePeers.map((peer, index) => {
          if (index === 0) {
            userVideosArray = [];
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
          if (userVideosArray.find((x) => x === peer.peerID)) {
            return null;
          }
          const uIndex = usersInRoom.findIndex((x) => x.socketId === peer.peerID);
          console.log("[RoomCopy] Found user in room:", usersInRoom[uIndex]);
          let userDetailIndex = -1;
          if (uIndex > -1) {
            userDetailIndex = users.findIndex((x) => x.username === usersInRoom[uIndex].username);
          }
          userVideosArray.push(peer.peerID);
          return (
            <div
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
                borderRadius: "10px",
                overflow: "hidden",
              }}
              id={peer.peerID}
              key={peer.peerID}
            >
              <div className="video-top-bar" style={{ position: "absolute", top: "0", background: "rgba(255,255,255,0.6)" }}>
                <span>{userDetailIndex > -1 ? users[userDetailIndex].username : "Unknown"}</span>
                <span>📌{userDetailIndex > -1 ? users[userDetailIndex].city : ""} </span>
                <span> 🌡️ {userDetailIndex > -1 ? users[userDetailIndex].temp : ""}°C </span>
                <span> 💧 {userDetailIndex > -1 ? users[userDetailIndex].humidity : ""}°C </span>
              </div>
              <Video
                peer={peer.peer}
                socket={socketRef.current}
                style={{
                  display: usersInRoom[uIndex] && usersInRoom[uIndex].isVideo ? "block" : "none",
                }}
              />
              <div
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  width: "100%",
                  backgroundColor: "black",
                  color: "white",
                  fontSize: "20px",
                  fontWeight: "bold",
                  display: usersInRoom[uIndex] && usersInRoom[uIndex].isVideo ? "none" : "flex",
                }}
              >
                Audio Only
              </div>
            </div>
          );
        })}
      </VideoGrid>
    );
  };

  return (
    <MainContainer>
      <Header {...props} />
      <Container>
        <MyVideoContainer>
          <StyledVideo
            style={{ display: hasVideo ? "block" : "none" }}
            muted
            ref={userVideo}
            autoPlay
            playsInline
          />
          <div
            style={{
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              width: "100%",
              backgroundColor: "black",
              color: "white",
              fontSize: "20px",
              fontWeight: "bold",
              display: hasVideo ? "none" : "flex",
            }}
          >
            Audio Only
          </div>
        </MyVideoContainer>
        {peers.length > 0 ? (
          getVideoGrid(peers)
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p>Waiting for participants...</p>
          </div>
        )}
        <Controls>
          <ImgComponent
            src={videoFlag ? webcam : webcamoff}
            onClick={() => {
              if (userVideo.current.srcObject) {
                userVideo.current.srcObject.getTracks().forEach((track) => {
                  if (track.kind === "video") {
                    if (track.enabled) {
                      console.log("[RoomCopy] Disabling local video track");
                      socketRef.current.emit("change", [
                        ...userUpdate,
                        { id: socketRef.current.id, videoFlag: false, audioFlag },
                      ]);
                      track.enabled = false;
                      setVideoFlag(false);
                    } else {
                      console.log("[RoomCopy] Enabling local video track");
                      socketRef.current.emit("change", [
                        ...userUpdate,
                        { id: socketRef.current.id, videoFlag: true, audioFlag },
                      ]);
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
                userVideo.current.srcObject.getTracks().forEach((track) => {
                  if (track.kind === "audio") {
                    if (track.enabled) {
                      console.log("[RoomCopy] Disabling local audio track");
                      socketRef.current.emit("change", [
                        ...userUpdate,
                        { id: socketRef.current.id, videoFlag, audioFlag: false },
                      ]);
                      track.enabled = false;
                      setAudioFlag(false);
                    } else {
                      console.log("[RoomCopy] Enabling local audio track");
                      socketRef.current.emit("change", [
                        ...userUpdate,
                        { id: socketRef.current.id, videoFlag, audioFlag: true },
                      ]);
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
