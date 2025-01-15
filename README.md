# Daily Bugle News Platform

The __Daily Bugle__ is a microservices-based web application designed for a fictional news platform. It includes services for user management, story creation, ad tracking, and comment handling. This project demonstrates a distributed architecture with independent services, each communicating via APIs and connected to a central MongoDB database.

## Project Structure
The repository contains the following services:

- `user_service`: Handles user registration, authentication, and sessions.
- `comment_service` : Enables users to add, retrieve, and manage comments on stories.
- `ad_service`: displays and tracks ad impressions and interactions.
- `front`: A user interface for interacting with the platform.
- `mongo`: The database used for all services.

## Setup Instructions

### 1. Prerequisites 
Ensure you have the following installed and up to date:
- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Apache HTTP Server](https://httpd.apache.org/)

### 2. Configure Enviromental Variables
- each service requires a .env file with the following structure:
```
MONGO_URI=mongodb://<appropriate MongoDB connection string>
ALLOWED_ORIGIN=http://frontend
```
- Copy this .env structure to the following directories 
  - `user_service/.env`
  - `story_service/.env`
  - `comment_service/.env`
  - `ad_service/.env`
    
- Install the `dotenv` package by running:
 ```
   npm install dotenv
```

### 3. Back-End Setup
- inside each service folder and the root directory run the following command
```
npm install mongodb
```
- Running the above command downloads the mongodb package with its dependencies, creates a node_modules folder if needed, and updates package.json with the package in dependencies (if package.json exists).

### 4. Upload ad image
- inside the `public` folder located in the `ad_service` folder add your own .jpg image file named ad_image.jpg (The current file is empty).

### 5. Download Dependencies
- Some additional depedencies will need to be downloaded including:
```
npm install express
```
```
npm install cors
```
```
npm install cookie-parser
```

## How to Run
- In the project root directory run this command:
```
docker-compose up --build 
```
- Open your browser and visit: http://localhost:8080/index.html
