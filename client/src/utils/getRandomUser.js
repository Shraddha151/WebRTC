// Create an array of 100 usernames
const usernames = Array.from({ length: 100 }, (_, index) => `User${index + 1}`);

// Function to get a random username
export const getRandomUsername = () => {
  const randomIndex = Math.floor(Math.random() * usernames.length);
  return usernames[randomIndex];
};

