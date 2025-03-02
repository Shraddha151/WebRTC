import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import { jwtDecode } from "jwt-decode";
import micmute from "../assets/micmute.svg";
import micunmute from "../assets/micunmute.svg";
import webcam from "../assets/webcam.svg";
import webcamoff from "../assets/webcamoff.svg";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { fetchUsers } from "../apis/authApis";

const Container = styled.div`
  height: 100vh;
  width: 20%;
`;

const MainContainer = styled.div`
  height: 100vh;
  width: 100%;
`;

const Controls = styled.div`
  margin: 3px;
  padding: 5px;
  height: 27px;
  width: 98%;
  background-color: rgba(255, 226, 104, 0.1);
  margin-top: -8.5vh;
  filter: brightness(1);
  z-index: 1;
  border-radius: 6px;
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
  height: 25px;
`;

const ImgComponentSmall = styled.img`
  height: 15px;
  text-align: left;
  opacity: 0.5;
`;

const StyledVideo = styled.video`
  width: 100%;
  position: static;
  border-radius: 10px;
  overflow: hidden;
  margin: 1px;
  border: 5px solid gray;
`;

const Video = (props) => {
  const ref = useRef();

  useEffect(() => {
    console.log("==== calling peer =======")
    props.peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });
  }, []);

  return <StyledVideo playsInline autoPlay ref={ref} />;
};

const Room = (props) => {
  let userVideosArray = [];
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [peers, setPeers] = useState([]);
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

  const fetchAllUser = async () => {
    const res = await fetchUsers();
    console.log(res)
    if(res && res.users) {
      setUsers(res.users);
    }
  }
  useEffect(() => {
    socketRef.current = io.connect("/");
    const token = localStorage.getItem("authTicket");

    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        console.log(decodedUser)
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

  async function getCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === "videoinput");
}

  async function createStream(dUser) {
    const cameraList = await getCameras()
    console.log(cameraList);
    navigator.mediaDevices
      .getUserMedia({ video: videoConstraints, audio: true })
      .then((stream) => {
        streamRef.current = stream
        userVideo.current.srcObject = stream;
        socketRef.current.emit("join room", { roomID, username: dUser.username });
        socketRef.current.on("all users", (users) => {
          console.log(users)
          const peers = [];
          users.forEach((socketUser) => {
            let userID = socketUser.socketId;
            let username = socketUser.username
            const peer = createPeer(userID, socketRef.current.id, stream, username);
            peersRef.current.push({
              peerID: userID,
              peer,
              username
            });
            let index = peers.findIndex((x) => x.peerID == userID);
            if (index == -1) {
              peers.push({
                peerID: userID,
                peer,
                username
              });
            }
          });
          setPeers(peers);
        });
        socketRef.current.on("user joined", (payload) => {
          console.log("==", payload)
          const peer = addPeer(payload.signal, payload.callerID, stream, payload.username);
          peersRef.current.push({
            peerID: payload.callerID,
            peer,
            username: payload.username
          });
          const peerObj = {
            peer,
            peerID: payload.callerID,
            username: payload.username
          };
          let index = peers.findIndex((x) => x.peerID == payload.callerID);
          if (index == -1) {
            setPeers((users) => [...users, peerObj]);
          }
        });

        socketRef.current.on("user left", (id) => {
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
          setUserUpdate(payload);
        });
      });
  }

  function createPeer(userToSignal, callerID, stream, username) {
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
        username
      });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream, username) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", { signal, callerID, username });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  return (
    <MainContainer>
      <Header {...props} />
      <Container>
        <div>
          <StyledVideo muted ref={userVideo} autoPlay playsInline />
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
            &nbsp;&nbsp;&nbsp;
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
            <span>{user?.username}</span>
          </Controls>
        </div>
        {peers.map((peer, index) => {
          if(index == 0) {
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
          if(videoIndex > -1) {
            return;
          }
          let userIndex = peers.findIndex((x) => user.username == peer.username);
          if(userIndex > -1) {
            
            console.log(peers[userIndex])
            console.log(userIndex)
          }

          userVideosArray.push(peer.peerID);
          return (
            <div id={peer.peerID} key={peer.peerID} style={{ position: "relative"}}>
              <div style={{ position: "absolute", top: "0", background: "rgba(0,0,0,0.6)" }}>Test toolbar</div>
              <Video peer={peer.peer} />
              <ControlSmall>
              </ControlSmall>
            </div>
          );
        })}
      </Container>
      <Footer />
    </MainContainer>
  );
};

export default Room;
