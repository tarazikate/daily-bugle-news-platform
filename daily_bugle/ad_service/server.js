const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3004;
const allowedOrigins = ['http://frontend', 'http://localhost:8080']; // Define allowed CORS origins

// Middleware to parse JSON requests
app.use(express.json());

// Enable CORS with specified origins and credentials support
app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Serve static files from the 'public' directory
app.use('/static', express.static('public'));

// Middleware to parse cookies in requests
app.use(cookieParser());

require('dotenv').config(); // Load environment variables from .env
const uri = process.env.MONGODB_URI; // Use the URI from the .env file

const dbName = "daily_bugle"; // Name of the database
let db; // Variable to store the database connection

// Connect to MongoDB, if not already connected
async function connectToDb() {
    if (!db) {
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        console.log("Connected to MongoDB");
    }
    return db;
}

// Log an ad impression
app.post('/ads/impression', async (req, res) => {
    try {
        const db = await connectToDb(); // Ensure the database connection is established
        const { userId, browser, os } = req.body; // Extract necessary data from the request

        await db.collection('ads').insertOne({
            userId: userId || null,
            type: 'impression',
            ip: req.ip, // Record the user's IP address
            browser,
            os,
            timestamp: new Date(),
        });

        res.status(201).send({ message: 'Impression logged successfully' });
    } catch (err) {
        console.error('Error logging impression:', err);
        res.status(500).send({ message: 'Internal server error' });
    }
});

// Log an ad interaction
app.post('/ads/interaction', async (req, res) => {
    try {
        const db = await connectToDb();
        const { userId, browser, os } = req.body;

        await db.collection('ads').insertOne({
            userId: userId || null,
            type: 'interaction',
            ip: req.ip,
            browser: browser || 'unknown', // Default to 'unknown' if browser info is not provided
            os: os || 'unknown', // Default to 'unknown' if OS info is not provided
            timestamp: new Date(),
        });

        res.status(201).send({ message: 'Interaction logged successfully' });
    } catch (err) {
        console.error('Error logging interaction:', err);
        res.status(500).send({ message: 'Internal server error' });
    }
});

// Get all interactions for a specific ad
app.get('/ads/:adId', async (req, res) => {
    try {
        const db = await connectToDb();
        const { adId } = req.params; // Extract the ad ID from the route

        const interactions = await db.collection('ad_interactions').find({ adId }).toArray();

        res.send(interactions);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Ad Service is running on http://localhost:${PORT}`);
});

