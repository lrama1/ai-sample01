// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const OpenAI = require('openai');
const e = require('express');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Load the knowledge base
const knowledgeBase = fs.readFileSync('knowledge_base.txt', 'utf-8');

const stopWords = [
    'the', 'is', 'in', 'at', 'of', 'and', 'a', 'to', 'it', 'that', 'on', 'for', 'with', 'as', 'by', 'an', 'be', 'this', 'which', 'or', 'from', 'but', 'not', 'are', 'was', 'were', 'can',
    'will', 'would', 'should', 'could', 'has', 'have', 'had', 'do', 'does', 'did', 'if', 'then', 'so', 'than', 'when', 'where', 'why', 'how', 'what', 'who', 'whom', 'whose', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'you', 'him', 'them', 'us', 'we', 'they', ' '
];

// Function to filter out stop words from the knowledge base
function filterStopWords(text) {
    return text.split(/\s+/).filter(word => word.trim() && !stopWords.includes(word.toLowerCase()));
}

// Function to check if the question is relevant to the knowledge base
function isRelevantQuestion(question, knowledgeBase) {
    const keywords = filterStopWords(knowledgeBase);
    const relevantKeywords = keywords.filter(keyword => question.includes(keyword));
    return relevantKeywords.length > 0 ? relevantKeywords : null;
}

app.post('/chat', async (req, res) => {
    const { message } = req.body;

    const relevantKeywords = isRelevantQuestion(message, knowledgeBase);

    if (!relevantKeywords) {
        console.log('Question is not relevant to the knowledge base');
        res.json({
            response: {
                content: 'I am not trained to answer this question. Please ask something else.'
            }
        });
    } else {
        console.log('Question is relevant due to keywords:', relevantKeywords);

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

            console.log('OpenAI API Response:', response.choices[0].message);
            res.json({ response: response.choices[0].message });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: error.message });
        }
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});