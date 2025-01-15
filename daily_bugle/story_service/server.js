const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3002;
const allowedOrigins = ['http://frontend', 'http://localhost:8080']; // Define allowed CORS origins

app.use(express.json()); // Parse incoming JSON payloads

app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true); // Allow requests from specified origins or tools like Postman
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

// Verify the user's session using cookies
async function verifyUser(req, res, next) {
    try {
        const userData = req.cookies.user_data;
        if (!userData) {
            return res.status(401).send({ message: 'Unauthorized: No user data' });
        }
        req.user = JSON.parse(userData);
        next();
    } catch (err) {
        console.error('Error parsing user data:', err);
        res.status(401).send({ message: 'Unauthorized: Invalid user data' });
    }
}

// Restrict access to authors
function restrictToAuthors(req, res, next) {
    if (req.user.role !== 'author') {
        return res.status(403).send({ message: 'Forbidden: Authors only' });
    }
    next();
}

// Create a new story (Authors only)
app.post('/stories', verifyUser, restrictToAuthors, async (req, res) => {
    try {
        const db = await connectToDb();
        const { title, teaser, body, categories } = req.body;
        const createdDate = new Date();

        const result = await db.collection('stories').insertOne({
            title,
            teaser,
            body,
            categories,
            createdDate,
            editedDate: createdDate,
            author: req.user.username,
        });

        res.status(201).send({ storyId: result.insertedId, message: "Story created successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Get all stories or filter by category
app.get('/stories', async (req, res) => {
    try {
        const db = await connectToDb();
        const { category } = req.query;
        const filter = category ? { categories: category } : {};
        const stories = await db.collection('stories').find(filter).toArray();
        res.send(stories);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Fetch previous and next stories
app.get('/stories/:id/navigation', async (req, res) => {
    try {
        const db = await connectToDb();
        const { id } = req.params;
        const currentStory = await db.collection('stories').findOne({ _id: new ObjectId(id) });

        if (!currentStory) return res.status(404).send({ message: "Story not found" });

        const [previous, next] = await Promise.all([
            db.collection('stories').find({ createdDate: { $lt: currentStory.createdDate } }).sort({ createdDate: -1 }).limit(1).toArray(),
            db.collection('stories').find({ createdDate: { $gt: currentStory.createdDate } }).sort({ createdDate: 1 }).limit(1).toArray(),
        ]);

        res.send({ previous: previous[0] || null, next: next[0] || null });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Fetch a single story by ID
app.get('/stories/:id', async (req, res) => {
    try {
        const db = await connectToDb();
        const { id } = req.params;

        if (!id || !ObjectId.isValid(id)) {
            return res.status(400).send({ message: 'Invalid story ID' });
        }

        const story = await db.collection('stories').findOne({ _id: new ObjectId(id) });
        if (!story) {
            return res.status(404).send({ message: "Story not found" });
        }

        res.send(story);
    } catch (err) {
        console.error('Error fetching story:', err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Update a story (Authors only)
app.put('/stories/:id', verifyUser, restrictToAuthors, async (req, res) => {
    try {
        const db = await connectToDb();
        const { id } = req.params;
        const { title, teaser, body, categories } = req.body;
        const editedDate = new Date();

        const result = await db.collection('stories').updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, teaser, body, categories, editedDate } }
        );

        res.send({ message: "Story updated successfully", modifiedCount: result.modifiedCount });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Delete a story and its associated comments (Authors only)
app.delete('/stories/:id', verifyUser, restrictToAuthors, async (req, res) => {
    try {
        const db = await connectToDb();
        const { id } = req.params;

        const result = await db.collection('stories').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).send({ message: "Story not found" });
        }

        const commentServiceUrl = 'http://comment_service:3003/comments/story';
        await fetch(`${commentServiceUrl}/${id}`, {
            method: 'DELETE',
        });

        res.send({ message: "Story and associated comments deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Story Service is running on http://localhost:${PORT}`);
});

