// backend/server2.js
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

// In-memory storage for conversation history (for demonstration purposes)
const conversationHistory = {};

app.post('/chat', async (req, res) => {
    const { message, sessionId } = req.body;

    // Initialize conversation history for the session if it doesn't exist
    if (!conversationHistory[sessionId]) {
        conversationHistory[sessionId] = [
            { role: 'system', content: `You are a chatbot that will exhange and propose ideas on how to address overpopulation.
                                            Limit your responses to 150 words or less.` }
        ];
    }

    // Add the user's message to the conversation history
    conversationHistory[sessionId].push({ role: 'user', content: message });

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: conversationHistory[sessionId],
            max_tokens: 1000,
            temperature: 0.7,
        });

        const aiMessage = response.choices[0].message.content.trim();

        // Add the AI's response to the conversation history
        conversationHistory[sessionId].push({ role: 'assistant', content: aiMessage });

        console.log('OpenAI API Response:', aiMessage);
        //res.json({ response: aiMessage });
        res.json({ response: response.choices[0].message });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});