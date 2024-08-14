const fs = require('fs');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Load the chat log
const chatLog = JSON.parse(fs.readFileSync('./config/chat-log.json', 'utf-8'));

// Function to analyze each chat entry
async function analyzeChatEntry(entry) {
    const { chat } = entry;

    // Analyze sentiment
    const sentimentResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{role:'system', content: `Analyze the sentiment of the following conversation:\n\n${chat}\n\nSentiment:`}],
        max_tokens: 10,
        temperature: 0,
    });

     const sentiment = sentimentResponse.choices[0].message.content.trim();

    // Summarize conversation
    const summaryResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages:[{role: 'system', content: `Summarize the following conversation:\n\n${chat}\n\nSummary:`}],
        max_tokens: 50,
        temperature: 0,
    });

    const summary = summaryResponse.choices[0].message.content.trim();

    // Determine subject
    const subjectResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{role:'system', content: `Determine the subject of the following conversation:\n\n${chat}\n\nSubject:`}],
        max_tokens: 20,
        temperature: 0,
    });

    const subject = subjectResponse.choices[0].message.content.trim();

    // Transcript (just the chat itself)
    const transcript = chat;

    return {
        sentiment,
        summary,
        subject,
        transcript
    };
}

// Analyze all chat entries
async function analyzeChatLog() {
    const analysisResults = [];

    for (const entry of chatLog) {
        const analysis = await analyzeChatEntry(entry);
        analysisResults.push({
            id: entry.id,
            analysis
        });
    }

    // Save the analysis results to a new JSON file
    fs.writeFileSync('./chat-log-analysis.json', JSON.stringify(analysisResults, null, 2));
    console.log('Analysis complete. Results saved to chat-log-analysis.json');
}

// Run the analysis
analyzeChatLog().catch(error => {
    console.error('Error analyzing chat log:', error);
});