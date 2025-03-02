import API from "./axiosConfig";

export const createRoom = async (roomName) => {
  try {
    const response = await API.post(
      "rooms/create",
      { roomName },
    );
    if(response.status == 200 && response.data) {
      return response.data
    }
    console.log("Room created successfully:", response.data);
  } catch (error) {
    console.error("Error creating room:", error);
  }
};

export const getRooms = async () => {
  try {
    const response = await API.get(
      "rooms"
    );
    if(response.status == 200 && response.data) {
      return response.data
    }
  } catch (error) {
    console.error("Error creating room:", error);
  }
};

export const getRoomDetails = async (roomId) => {
  try {
    const response = await API.get(
      `rooms/${roomId}`
    );
    if(response.status == 200 && response.data) {
      return response.data
    }
    return false
  } catch (error) {
    console.error("Error creating room:", error);
    return false
  }
};

export const fetchAllUsersInRoom = async (roomID) => {
  try {
    const response = await API.get(
      `room/${roomID}`
    );
    if(response.status == 200 && response.data) {
      return response.data
    }
  } catch (error) {
    console.error("Error creating room:", error);
  }
};



export const deleteRoom = async (roomId, token) => {
    try {
      const response = await API.delete(
        "rooms",
        { roomId },
        {
          headers: {
            Authorization: token, // Include the JWT token in headers
          },
        }
      );
      console.log("Room created successfully:", response.data);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };
  
