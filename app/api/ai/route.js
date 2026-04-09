import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const RETRYABLE_STATUS_CODES = new Set([429, 500, 503]);
const MAX_RETRIES = 2;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractStatusCode = (error) => {
  if (typeof error?.status === "number") return error.status;
  if (typeof error?.code === "number") return error.code;
  if (typeof error?.response?.status === "number") return error.response.status;
  return null;
};

const isRetryableGeminiError = (error) => {
  const status = extractStatusCode(error);
  return status !== null && RETRYABLE_STATUS_CODES.has(status);
};

const generateWithRetry = async (model, payload) => {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await model.generateContent(payload);
    } catch (error) {
      lastError = error;

      if (!isRetryableGeminiError(error) || attempt === MAX_RETRIES) {
        throw error;
      }

      const delayMs = 600 * (attempt + 1);
      console.warn(
        `Gemini temporary failure (${extractStatusCode(error)}). Retrying in ${delayMs}ms.`
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
};

const buildPrompt = (type, hasFile) => {
  const prefix = hasFile
    ? "The user has uploaded a document or image as their study material. Analyse it carefully and then "
    : "";

  const map = {
    summary: `${prefix}summarize this content in a clear and concise way for a student. Use bullet points where appropriate and keep it under 150 words:\n\n`,
    explain: `${prefix}explain this topic in very simple terms, like a teacher speaking to a 10-year-old. Use simple language, relatable analogies, and short sentences. Break it down step by step:\n\n`,
    quiz: `${prefix}generate exactly 20 Multiple Choice Questions (MCQs) with 4 options each (A, B, C, D) and 10 Theory (short answer) questions based on this content. Format your response EXACTLY like this:

--- MCQS ---
Q1: [Question]
A) [Choice]
B) [Choice]
C) [Choice]
D) [Choice]
Correct: [Letter]

[Repeat for Q1 to Q20]

--- THEORY ---
T1: [Question]
Answer: [Explanation]

[Repeat for T1 to T10]

Content:\n\n`,
    mindmap: `${prefix}generate a visual relationship diagram or mind map using Mermaid.js syntax (use graph TD). Show connections between key topics and subtopics. Return ONLY the code, no markdown blocks:\n\n`,
    flashcards: `${prefix}generate exactly 12 study flashcards based on this content. Each flashcard must be concise, useful for revision, and formatted EXACTLY like this:

CARD 1
Front: [Question, key term, or prompt]
Back: [Answer, definition, or explanation]

[Repeat for CARD 1 to CARD 12 with a blank line between cards]

Content:\n\n`,
  };

  return map[type];
};

export async function POST(request) {
  try {
    if (
      !process.env.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY === "your_gemini_api_key_here"
    ) {
      return Response.json(
        {
          error:
            "GEMINI_API_KEY is not configured. Please add it to your .env.local file.",
        },
        { status: 500 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    let type, content, fileBase64, fileMimeType;

    // ── File upload path ──────────────────────────────────────────────────────
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      type = formData.get("type");
      const file = formData.get("file");

      if (!file || typeof file === "string") {
        return Response.json(
          { error: "No file received. Please upload a PDF or image." },
          { status: 400 }
        );
      }

      // 10 MB hard limit
      if (file.size > 10 * 1024 * 1024) {
        return Response.json(
          { error: "File too large. Maximum size is 10 MB." },
          { status: 400 }
        );
      }

      const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
      ];
      if (!allowed.includes(file.type)) {
        return Response.json(
          {
            error:
              "Unsupported file type. Please upload a PDF or image (JPEG, PNG, WEBP, GIF).",
          },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      fileBase64 = Buffer.from(arrayBuffer).toString("base64");
      fileMimeType = file.type;
    } else {
      // ── Plain-text path ─────────────────────────────────────────────────────
      const body = await request.json();
      type = body.type;
      content = body.content;

      if (!content || content.trim().length < 20) {
        return Response.json(
          { error: "Please provide at least 20 characters of content." },
          { status: 400 }
        );
      }
    }

    if (!type || !["summary", "explain", "quiz", "mindmap", "flashcards"].includes(type)) {
      return Response.json(
        { error: "Invalid type. Must be: summary, explain, quiz, mindmap, or flashcards." },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const promptText = buildPrompt(type, !!fileBase64);

    let aiResult;

    if (fileBase64) {
      aiResult = await generateWithRetry(model, [
        { inlineData: { data: fileBase64, mimeType: fileMimeType } },
        promptText,
      ]);
    } else {
      aiResult = await generateWithRetry(model, `${promptText}${content.trim()}`);
    }

    const text = aiResult.response.text();
    return Response.json({ result: text });
  } catch (error) {
    console.error("Gemini API Error:", error);

    const status = extractStatusCode(error);
    if (status === 429 || status === 503) {
      return Response.json(
        {
          error:
            "StudyMate AI is temporarily overloaded right now. Please wait a few seconds and try again.",
          retryable: true,
        },
        { status: 503, headers: { "Retry-After": "5" } }
      );
    }

    return Response.json(
      { error: "Failed to generate a response. Please try again." },
      { status: 500 }
    );
  }
}
