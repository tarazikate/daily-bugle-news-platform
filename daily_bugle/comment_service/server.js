const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3003;
const allowedOrigins = ['http://frontend', 'http://localhost:8080']; // Define allowed CORS origins

// Middleware to parse incoming JSON requests
app.use(express.json());

// Enable CORS with specified origins and credentials
app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies with requests
}));

app.use(cookieParser()); // Parse cookies in requests

require('dotenv').config(); // Load environment variables from .env
const uri = process.env.MONGODB_URI; // Use the URI from the .env file

const dbName = "daily_bugle"; // Database name
let db; // Store the database connection

// Establish a connection to MongoDB
async function connectToDb() {
    if (!db) {
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        console.log("Connected to MongoDB");
    }
    return db;
}

// Middleware: Check user role from cookies
async function checkRole(req, res, next) {
    try {
        const userData = req.cookies.user_data ? JSON.parse(req.cookies.user_data) : null;
        if (!userData || !userData.username) {
            return res.status(401).send({ message: "Unauthorized: No user data" });
        }

        const db = await connectToDb();
        const user = await db.collection('users').findOne({ username: userData.username });
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        req.userRole = user.role; // Attach user role to the request
        req.username = user.username; // Attach username to the request
        next();
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
}

// Routes

// Create a new comment
app.post('/comments', checkRole, async (req, res) => {
    try {
        const db = await connectToDb();
        const { storyId, userId, text } = req.body;

        if (req.userRole !== 'reader' && req.userRole !== 'author') {
            return res.status(403).send({ message: "Permission denied" });
        }

        const result = await db.collection('comments').insertOne({
            storyId: new ObjectId(storyId),
            commenter: req.username,
            text,
            createdAt: new Date(),
            updatedAt: null,
        });

        res.status(201).send({ commentId: result.insertedId });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Get all comments for a specific story
app.get('/comments/:storyId', async (req, res) => {
    try {
        const db = await connectToDb();
        const { storyId } = req.params;

        const comments = await db.collection('comments').find({ storyId: new ObjectId(storyId) }).toArray();
        res.send(comments);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Search comments by text
app.get('/comments/search', async (req, res) => {
    try {
        const db = await connectToDb();
        const { query, storyId } = req.query;

        const searchCriteria = { text: { $regex: query, $options: 'i' } };
        if (storyId) searchCriteria.storyId = new ObjectId(storyId);

        const comments = await db.collection('comments').find(searchCriteria).toArray();
        res.send(comments);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Update a comment
app.put('/comments/:id', checkRole, async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;

    if (req.userRole !== 'author') {
        return res.status(403).send({ message: 'Permission denied' });
    }

    try {
        const result = await db.collection('comments').updateOne(
            { _id: new ObjectId(id) },
            { $set: { text, updatedAt: new Date() } }
        );

        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal server error' });
    }
});

// Delete a comment
app.delete('/comments/:id', checkRole, async (req, res) => {
    const { id } = req.params;

    if (req.userRole !== 'author') {
        return res.status(403).send({ message: 'Permission denied' });
    }

    try {
        const result = await db.collection('comments').deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal server error' });
    }
});

// Delete all comments for a specific story
app.delete('/comments/story/:storyId', async (req, res) => {
    try {
        const db = await connectToDb();
        const { storyId } = req.params;

        const result = await db.collection('comments').deleteMany({ storyId: new ObjectId(storyId) });
        res.send({ message: "Comments deleted successfully", deletedCount: result.deletedCount });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Comment Service is running on http://localhost:${PORT}`);
});

