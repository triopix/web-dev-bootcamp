// 1. Import necessary libraries
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); // Loads .env file contents into process.env  
const path = require("path"); // Helps with file paths

// 2. Initialize Express app
const app = express();
const port = 3000;

// 3. Configure Gemini API
let genAI;
let model;
const modelName = "gemini-2.5-flash-preview-04-17"; // Your desired model
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "API Key not found in .env file. Please set GEMINI_API_KEY."
    );
  }
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: modelName });
  console.log(
    `AdvaitaChat (using Gemini API) configured successfully with model: ${model.model}`
  );
} catch (error) {
  console.error(
    `FATAL ERROR: Could not configure AdvaitaChat (Gemini API) or model '${modelName}':`,
    error.message
  );
}

// 4. Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// 5. Define Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "S3", "advaita.html"));
});

app.post("/submit_to_gemini", async (req, res) => {
  if (!model) {
    return res
      .status(500)
      .send(
        "Error: AdvaitaChat's underlying AI model is not configured. Check server logs."
      );
  }

  const userQuestion = req.body.user_message;

  if (!userQuestion || userQuestion.trim() === "") {
    return res
      .status(400)
      .send(
        "Oops! You didn't ask a question. Please go back and type something."
      );
  }

  console.log(`Original question for AdvaitaChat: ${userQuestion}`);
  let advaitaChatAnswerText =
    "Sorry, an error occurred while trying to contact AdvaitaChat.";

  // Modify the prompt for succinctness (EXPERIMENT with this!)
  const modifiedQuestion = `${userQuestion}\n\n format output to be (readable, succint, reliable)`; // Keep it simple for now lol
  // Examples for more specific instructions:
  // const modifiedQuestion = `${userQuestion}\n\nAnswer in two sentences.`;
  // const modifiedQuestion = `${userQuestion}\n\nExplain this as briefly as possible.`;

  try {
    console.log(`Sending to model (${modelName}): ${modifiedQuestion}`);
    const result = await model.generateContent(modifiedQuestion); // Use the modified question
    const response = result.response;
    advaitaChatAnswerText = response.text();
    console.log(
      `Received answer from AdvaitaChat (via model ${modelName}): ${advaitaChatAnswerText}`
    );
  } catch (error) {
    console.error(
      `Error calling AdvaitaChat's underlying API (model ${modelName}):`,
      error.message
    );
    if (error.message.includes("API key not valid")) {
      advaitaChatAnswerText =
        "Error: The API key for AdvaitaChat is not valid. Please check your .env file.";
    } else if (
      error.message.toLowerCase().includes("model not found") ||
      error.message.toLowerCase().includes("permission denied")
    ) {
      advaitaChatAnswerText = `Error: AdvaitaChat could not access the AI model '${modelName}'. It might not be available with your API key or the name is incorrect. Try a general release model like 'gemini-1.5-flash-latest'.`;
    } else {
      advaitaChatAnswerText = `An error occurred while AdvaitaChat was processing your request: ${error.message}`;
    }
  }

  // HTML response
  res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AdvaitaChat</title>
        </head>
        <body>
            <h1>Your Question:</h1>
            <pre style="white-space: pre-wrap; word-wrap: break-word; border: 1px solid #ccc; padding: 10px;">${userQuestion
              .replace(/</g, "<")
              .replace(/>/g, ">")}</pre>

            <h2>AdvaitaChat's Answer:</h2>
            <pre style="white-space: pre-wrap; word-wrap: break-word; border: 1px solid #ccc; padding: 10px;">${advaitaChatAnswerText
              .replace(/</g, "<")
              .replace(/>/g, ">")}</pre>
            <hr>
            <p><a href="/S3/advaita.html">Back to Main Page</a></p>
        </body>
        </html>
    `);
});

// 6. Start the server
app.listen(port, () => {
  console.log(`AdvaitaChat Node.js server running.`);
  console.log(
    `Model in use: ${model ? model.model : "None (Error during init)"}`
  );
  console.log(
    `Your Advaita page should be accessible at http://localhost:${port}/S3/advaita.html`
  );
  console.log(
    `Or try the root: http://localhost:${port}/ (should serve Advaita page)`
  );
  console.log(
    `Submitting the 'Any Questions?' form will post to /submit_to_gemini`
  );
});
