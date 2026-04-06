import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage, AIMessage } from "langchain";

const geminiModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
});

const mistralModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
});

export async function generateResponse(messages) {
  const response = await geminiModel.invoke(
    messages.map((msg) => {
      if (msg.role === "user") return new HumanMessage(msg.content);
      else if (msg.role === "ai") return new AIMessage(msg.content);
    }),
  );

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
