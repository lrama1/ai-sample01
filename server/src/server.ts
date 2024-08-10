import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import OpenAI from 'openai';
import pluralize from 'pluralize';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Define the structure of the knowledge base entry
interface KnowledgeBaseEntry {
    question: string;
    answer: string;
}

// Load and parse the knowledge base
const knowledgeBase: KnowledgeBaseEntry[] = fs.readFileSync('./config/knowledge_base.txt', 'utf-8').split('\n').reduce((acc: KnowledgeBaseEntry[], line: string) => {
    if (line.startsWith('Q:')) {
        acc.push({ question: line.slice(2).trim(), answer: '' });
    } else if (line.startsWith('A:')) {
        acc[acc.length - 1].answer = line.slice(2).trim();
    }
    return acc;
}, []);

const stopWords: string[] = [
    'the', 'is', 'in', 'at', 'of', 'and', 'a', 'to', 'it', 'that', 'on', 'for', 'with', 'as', 'by', 'an', 'be', 'this', 'which', 'or', 'from', 'but', 'not', 'are', 'was', 'were', 'can',
    'will', 'would', 'should', 'could', 'has', 'have', 'had', 'do', 'does', 'did', 'if', 'then', 'so', 'than', 'when', 'where', 'why', 'how', 'what', 'who', 'whom', 'whose', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'you', 'him', 'them', 'us', 'we', 'they'
];

// Function to filter out stop words and punctuation from the text
function filterStopWords(text: string): string[] {
    return text.replace(/[^\w\s]|_/g, "").split(/\s+/).filter(word => word.trim() && !stopWords.includes(word.toLowerCase()));
}

// Function to check if the question is relevant to the knowledge base and retrieve the corresponding answer
function getRelevantAnswer(question: string, knowledgeBase: KnowledgeBaseEntry[]): string | null {
    const filteredQuestion = filterStopWords(question).map(word => pluralize.singular(word));
    for (const entry of knowledgeBase) {
        const filteredKnowledgeQuestion = filterStopWords(entry.question).map(word => pluralize.singular(word));
        const commonWords = filteredKnowledgeQuestion.filter(word => filteredQuestion.includes(word));
        if (commonWords.length > 0) {
            return entry.answer;
        }
    }
    return null;
}

app.post('/chat', async (req: Request, res: Response) => {
    const { message } = req.body;

    const answer = getRelevantAnswer(message, knowledgeBase);

    if (!answer) {
        console.log('Question is not relevant to the knowledge base');
        res.json({
            response: {
                content: 'I am not trained to answer this question. Please ask something else.'
            }
        });
    } else {
        console.log('Question is relevant. Responding with:', answer);
        res.json({ response: { content: answer } });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});