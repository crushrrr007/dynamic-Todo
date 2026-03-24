require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Required to parse incoming JSON payloads
app.use(express.json());

const MONGO_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 8080;

if (!MONGO_URI) {
    console.error("FATAL ERROR: MONGODB_URI is not defined in environment variables.");
    process.exit(1); 
}

mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB successfully."))
    .catch((err) => {
        console.error("Failed to connect to MongoDB on startup:", err.message);
        process.exit(1); 
    });

mongoose.connection.on('error', err => {
    console.error("MongoDB runtime error:", err.message);
});

mongoose.connection.on('disconnected', () => {
    console.warn("MongoDB connection lost.");
});

// --- NEW LOGIC: Project Idea Tracker ---

const ideaSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
});

const Idea = mongoose.model('Idea', ideaSchema);

app.use(express.static(path.join(__dirname, 'public')));

// Create a new idea
app.post('/api/ideas', async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required.' });
        }
        
        const newIdea = new Idea({ title, description });
        await newIdea.save();
        
        res.status(201).json(newIdea);
    } catch (error) {
        console.error('Error saving idea:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Retrieve all ideas
app.get('/api/ideas', async (req, res) => {
    try {
        // Fetch latest 50 ideas
        const ideas = await Idea.find().sort({ createdAt: -1 }).limit(50);
        res.status(200).json(ideas);
    } catch (error) {
        console.error('Error fetching ideas:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server bound to port ${PORT}`);
});
