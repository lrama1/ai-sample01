// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const OpenAI = require('openai');
const stringSimilarity = require('string-similarity');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Load and parse the knowledge base
const knowledgeBase = fs.readFileSync('./config/knowledge_base.txt', 'utf-8');
const knowledgeBaseLines = knowledgeBase.split('\n').map(line => line.trim()).filter(line => line);

// Function to find the most similar question in the knowledge base
const findMostSimilarQuestion = (question) => {
    const matches = stringSimilarity.findBestMatch(question, knowledgeBaseLines);
    return matches.bestMatch;
};

app.post('/chat', async (req, res) => {
    const { message } = req.body;

    const bestMatch = findMostSimilarQuestion(message);

    // Define a threshold for similarity score
    const similarityThreshold = 0.5;

    console.log('Best Match:', bestMatch.rating);
    if (bestMatch.rating < similarityThreshold) {
        return res.json({ response: "I don't have data to answer that question" });
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: knowledgeBase },
                { role: 'user', content: message }
            ],
            max_tokens: 100,
            temperature: 0.7,
        });

        //console.log('OpenAI API Response:', response.choices[0].message);
        res.json({ response: response.choices[0].message });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});