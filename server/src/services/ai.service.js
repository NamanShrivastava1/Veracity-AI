import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  tool,
  createAgent,
} from "langchain";
import * as z from "zod";
import { searchInternet } from "./internet.service.js";

const geminiModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
});

const mistralModel = new ChatMistralAI({
  model: "mistral-medium-latest",
  apiKey: process.env.MISTRAL_API_KEY,
});

const searchInternetTool = tool(searchInternet, {
  name: "searchInternet",
  description: `
    Use this tool to search the internet for latest and real-time information.

    Always use it for:
    - current prices (gold, stocks, crypto)
    - news
    - live updates

    Input should be a clear search query like:
    "gold price in India today"
  `,
  inputSchema: z.object({
    query: z.string(),
  }),
});

const agent = createAgent({
  model: geminiModel,
  tools: [searchInternetTool],
});

export async function generateResponse(messages) {
  const lastMessage = messages[messages.length - 1].content;

  const needsSearch = /today|latest|current|price|news/i.test(lastMessage);

  let context = "";

  if (needsSearch) {
    console.log("Calling Tavily...");
    context = await searchInternet({ query: lastMessage });
  }

  const response = await geminiModel.invoke([
    new SystemMessage(`
    You are a helpful AI assistant.

    - If context is provided, use it as the primary source.
    - Do NOT say the tool failed.
    - Give a clear and direct answer.
    `),
    new HumanMessage(`
      Question: ${lastMessage}

      Context:
        ${context}
      `),
  ]);

  return response.text;
}

export async function generateChatTitle(messages) {
  const response = await mistralModel.invoke([
    new SystemMessage(
      `You are a helpful assistant that generates concise and descriptive titles for chat conversations. Based on the following conversation, provide a title that captures the main topic or theme of the discussion. The title should be brief, ideally no more than 5 words, and should accurately reflect the content of the conversation.`,
    ),
    new HumanMessage(
      `Generate a title for the following conversation based on the following first message: ${messages}`,
    ),
  ]);
  return response.text;
}
