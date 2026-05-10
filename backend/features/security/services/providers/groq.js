import Groq from "groq-sdk";
import AppError from "../../../../utils/apperror.js";
import { buildPrompt } from "./buildPrompt.js";
import { validateAiResponse } from "./validateAiResponse.js";

const TIMEOUT_MS = 10000;
let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

export async function callGroq(sanitizedPayload) {
  const groq = getGroqClient();
  const prompt = buildPrompt(sanitizedPayload);

  const timeoutPromise = new Promise((_, reject) =>
    globalThis.setTimeout(
      () => reject(new AppError("Groq request timed out", 504, "AI_TIMEOUT")),
      TIMEOUT_MS,
    ),
  );

  let aiResponse;
  try {
    aiResponse = await Promise.race([
      groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
      timeoutPromise,
    ]);
  } catch (error) {
    throw new AppError(
      "Groq API call failed: " + error.message,
      502,
      "AI_ERROR",
    );
  }

  const content = aiResponse.choices?.[0]?.message?.content;
  if (!content) {
    throw new AppError("Groq response missing content", 502, "AI_ERROR");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AppError("Groq response is not valid JSON", 502, "AI_ERROR");
  }

  return validateAiResponse(parsed, "Groq");
}
