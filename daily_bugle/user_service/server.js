const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3001;
const allowedOrigins = ['http://frontend', 'http://localhost:8080']; // Allowed origins for CORS

app.use(express.json()); // Parse incoming JSON requests

// Enable CORS for specified origins
app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true); // Allow requests from allowed origins or no origin (e.g., Postman)
        } else {
            callback(new Error('Not allowed by CORS')); // Reject disallowed origins
        }
    },
    credentials: true, // Allow cookies with requests
}));

app.use(cookieParser()); // Parse cookies from requests

require('dotenv').config(); // Load environment variables from .env
const uri = process.env.MONGODB_URI; // Use the URI from the .env file

const dbName = "daily_bugle"; // Database name
let db;

// Connect to MongoDB
async function connectToDb() {
    if (!db) {
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        console.log("Connected to MongoDB");
    }
    return db;
}

// Register a new user
app.post('/users', async (req, res) => {
    try {
        const db = await connectToDb();
        const { username, password, role } = req.body;

        // Check if username already exists
        const existingUser = await db.collection('users').findOne({ username });
        if (existingUser) {
            return res.status(400).send({ message: 'Username already exists' });
        }

        const newUser = { username, password, role: role || 'reader' }; // Default role is 'reader'
        const result = await db.collection('users').insertOne(newUser);
        res.status(201).send({ userId: result.insertedId }); // Respond with new user ID
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal server error' });
    }
});

// Log in a user
app.post('/login', async (req, res) => {
    try {
        const db = await connectToDb();
        const { username, password } = req.body;

        // Find a matching user in the database
        const user = await db.collection('users').findOne({ username, password });
        if (!user) {
            return res.status(401).send({ message: 'Invalid credentials' });
        }

        const userData = { username: user.username, role: user.role }; // Include username and role
        res.cookie('user_data', JSON.stringify(userData), { httpOnly: true, sameSite: 'Strict' }); // Set secure cookie
        res.send({ message: 'Login successful', role: user.role }); // Respond with success and role
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal server error' });
    }
});

// Log out a user
app.post('/logout', (req, res) => {
    res.clearCookie('user_data'); // Clear the user session cookie
    res.send({ message: 'Logout successful' }); // Respond with success message
});

// Start the server
app.listen(PORT, () => {
    console.log(`User Service is running on http://localhost:${PORT}`);
});

