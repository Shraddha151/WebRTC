# Use an official Node.js runtime as a parent image
FROM node:18

# Create and set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your project files
COPY . .

# Expose the port your app runs on (adjust if you use a different port)
EXPOSE 8000

# Start the application
CMD ["npm", "start"]
