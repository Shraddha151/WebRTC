import API from "./axiosConfig";

export const createUser = async (username, email, password, city) => {
  try {
    const response = await API.post(
      "auth/register",
      { username, email, password, city },
    );
    console.log("Room created successfully:", response);
    return response
  } catch (error) {
    console.error("Error creating room:", error);
  }
  return false;
};

export const fetchUsers = async () => {
  try {
    const response = await API.get("auth/users");
    
    if(response.status == 200) {
      return response.data
    }
    return false
  } catch (error) {
    console.error("Error creating room:", error);
  }
  return false;
};

export const loginUser = async (email, password) => {
  try {
    const response = await API.post("/auth/login", { email, password });
    if (response.data.ticket) {
      localStorage.setItem("authTicket", response.data.ticket);
      console.log("Login successful");
      return response.data;
    }
  } catch (error) {
    console.error("Login failed:", error.response?.data || error.message);
    return null;
  }
};

export const logoutUser = () => {
  localStorage.removeItem("authTicket");
  console.log("User logged out");
};

export const validateTicket = async () => {
  const ticket = localStorage.getItem("authTicket");
  if (!ticket) return false;

  try {
    const response = await API.get("/auth/validate-ticket", {
      headers: { Authorization: ticket },
    });
    return response.data;
  } catch (error) {
    console.error("Ticket validation failed:", error.response?.data || error.message);
    return false;
  }
};