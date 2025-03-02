import React, { useState, useEffect } from "react";
import { createRoom, getRoomDetails, getRooms } from "../apis/roomApi";
import { BiClipboard } from "react-icons/bi";
import useClipboard from "react-use-clipboard";
import Toast from 'light-toast';

const Li = ({ room, onRoomSelect }) => {
  const [isCopied, setCopied] = useClipboard(room.roomId, {
    successDuration: 1000,
  });
  return (
    <li
      key={room._id}
      onClick={() => { onRoomSelect(room.roomId) }}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        marginBottom: "10px",
        cursor: "pointer",
        backgroundColor: "#f9f9f9",
      }}
    >
      <strong>{room.roomName}</strong>
      <button style={{
        width: "80px",
        padding: "10px",
        backgroundColor: "blue",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
        onClick={(e) => {
          e.stopPropagation()
          setCopied();
        }}
      >
        <BiClipboard />
        {isCopied && " Copied"}
      </button>

    </li>
  )
}
const RoomList = (props) => {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch the list of rooms
  const onRoomSelect = (roomId) => {
    props.history.push(`/room/${roomId}`);
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await getRooms();
      setLoading(false);
      if (response && response.length) {
        setRooms(response);
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new room
  const createRoomClick = async () => {
    if (!newRoomName.trim()) return;
    try {
      const response = await createRoom(newRoomName);
      if (response?.room) {
        setRooms((prevRooms) => [...prevRooms, response.room]);
      }
      setNewRoomName("");
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  // Load rooms on component mount
  useEffect(() => {
    fetchRooms();
  }, []);

  const handleJoinRoom = async () => {
    let details = await getRoomDetails(joinRoomId);
    if(details && details.room && details.room.roomId == joinRoomId) {
      props.history.push(`/room/${details.room.roomId}`);
    } else {
      Toast.fail("Invalid Room Id", 3000, () => {});
    }

  }

  return (
    <div style={{ display: "flex", "alignItems": "center", justifyContent: "space-evenly" }}>
      <div></div>
      <div>
        <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Room List</h2>

          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Enter room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                border: "1px solid #ccc",
                borderRadius: "5px",
              }}
            />
            <button
              onClick={createRoomClick}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "blue",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Create New Room
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center" }}>
              <span>Loading...</span>
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: "0" }}>
              {rooms.map((room) => (
                <Li onRoomSelect={onRoomSelect} room={room} />
              ))}
            </ul>
          )}
        </div>
      </div>
      <div>
        <input style={{
          borderRadius: "5px",
          height: "36px",
          marginRight: "3px",
          paddingLeft: "5px"
        }} value={joinRoomId} onChange={(e) => setJoinRoomId(e.target.value)} type="text" placeholder="Enter Room Id"/>
        <button style={{
          width: "100px",
          padding: "10px",
          backgroundColor: "blue",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
          onClick={(e) => {
            e.stopPropagation()
            handleJoinRoom();

          }}
        >
          Join Room
        </button>
      </div>
    </div>
  );
};

export default RoomList;
