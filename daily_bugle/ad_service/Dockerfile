# Use Node.js base image
FROM node:latest

# Set the working directory
WORKDIR /app

# Copy the application code
COPY . .

# Install dependencies
RUN npm install cors && npm install

# Expose the port
EXPOSE 3004

# Start the application
CMD ["node", "server.js"]

