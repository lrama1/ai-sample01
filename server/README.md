# Chat Analyzer

`chatanalyzer.js` is a Node.js script that analyzes chat logs to determine the sentiment, summary, subject, and transcript of each chat entry. It uses the OpenAI API to perform natural language processing tasks.

## Prerequisites

- Node.js installed on your machine
- An OpenAI API key
- A `.env` file with your OpenAI API key

## Installation

1. Clone the repository or download the project.
2. Install the required packages by running:
   ```sh
   npm install fs dotenv openai
   ```

## Setup

1. Create a `.env` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

2. Ensure you have a `chat-log.json` file in the `./config` directory with the chat logs you want to analyze.

## Usage

Run the script using Node.js:
```sh
node chatanalyzer.js
```

## How It Works

1. **Load Dependencies**: The script loads required modules and initializes the OpenAI API with the API key from the environment variables.
   ```javascript
   const fs = require('fs');
   const OpenAI = require('openai');
   require('dotenv').config();

   const openai = new OpenAI({
       apiKey: process.env.OPENAI_API_KEY
   });
   ```

2. **Load Chat Log**: The chat log data is read from the JSON file located at `./config/chat-log.json`.
   ```javascript
   const chatLog = JSON.parse(fs.readFileSync('./config/chat-log.json', 'utf-8'));
   ```

3. **Analyze Each Chat Entry**: For each chat entry, the script uses the OpenAI API to:
   - Determine the sentiment.
   - Summarize the conversation.
   - Determine the subject.
   - Include the transcript (the chat itself).

   ```javascript
   async function analyzeChatEntry(entry) {
       const { chat } = entry;

       // Analyze sentiment
       const sentimentResponse = await openai.chat.completions.create({
           model: modelId,
           messages: [{role:'system', content: `Analyze the sentiment of the following conversation and output should be either positive, negative or neutral:\n\n${chat}\n\nSentiment:`}],
           max_tokens: 50,
           temperature: 0,
       });

       const sentiment = sentimentResponse.choices[0].message.content.trim();

       // Summarize conversation
       const summaryResponse = await openai.chat.completions.create({
           model: modelId,
           messages:[{role: 'system', content: `Summarize the following conversation:\n\n${chat}\n\nSummary:`}],
           max_tokens: 50,
           temperature: 0,
       });

       const summary = summaryResponse.choices[0].message.content.trim();

       // Determine subject
       const subjectResponse = await openai.chat.completions.create({
           model: modelId,
           messages:[{role: 'system', content: `Determine the subject of the following conversation:\n\n${chat}\n\nSubject:`}],
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
   ```

4. **Save Results**: The analysis results are saved to a new JSON file `chat-log-analysis.json`.
   ```javascript
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
   ```

## Output

The script generates a `chat-log-analysis.json` file with the analysis results for each chat entry, including sentiment, summary, subject, and transcript.

## Example

Given a chat log entry:
```json
{
    "id": "001",
    "chat": "Hello, you have reached Acme Corp. My name is Alexa. How can I help you today? My name is John Smith and I am calling about my account. I am sorry, but I am unable to assist you with that. I will transfer you to the appropriate department. Thank you for your help. You're welcome. Goodbye."
}
```

The output might look like:
```json
[
    {
        "id": "001",
        "analysis": {
            "sentiment": "neutral",
            "summary": "John Smith called about his account and was transferred to the appropriate department.",
            "subject": "Account inquiry",
            "transcript": "Hello, you have reached Acme Corp. My name is Alexa. How can I help you today? My name is John Smith and I am calling about my account. I am sorry, but I am unable to assist you with that. I will transfer you to the appropriate department. Thank you for your help. You're welcome. Goodbye."
        }
    }
]
```

