// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const OpenAI = require('openai');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Load the knowledge base
const knowledgeBase = fs.readFileSync('./config/knowledge_base.txt', 'utf-8');

app.post('/chat', async (req, res) => {
    const { message } = req.body;

    try {
        
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: `You are a helpful assistant. Only answer questions that are in this context: ${knowledgeBase}` },
                { role: 'user', content: message }
            ],
            max_tokens: 100,
            temperature: 0,
        });

        console.log('OpenAI API Response:', response.choices[0].message);
        res.json({ response: response.choices[0].message });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});