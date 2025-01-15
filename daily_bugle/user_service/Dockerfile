#Use Node.js as the base image
FROM node:latest

# Set the working directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN npm install cors && npm install

# Expose the port
EXPOSE 3001

# Run the application
CMD ["node", "server.js"]


