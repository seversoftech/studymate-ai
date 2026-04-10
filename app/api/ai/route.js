import { GoogleGenerativeAI } from "@google/generative-ai";

const PRIMARY_ENGINE = "spark";
const BACKUP_ENGINE = "focus";
const VALID_TYPES = new Set([
  "summary",
  "explain",
  "quiz",
  "mindmap",
  "flashcards",
  "keypoints",
]);
const RETRYABLE_STATUS_CODES = new Set([429, 500, 503]);
const MAX_RETRIES = 2;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractStatusCode = (error) => {
  if (typeof error?.status === "number") return error.status;
  if (typeof error?.code === "number") return error.code;
  if (typeof error?.response?.status === "number") return error.response.status;
  return null;
};

const createHttpError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const isRetryableError = (error) => {
  const status = extractStatusCode(error);
  return status !== null && RETRYABLE_STATUS_CODES.has(status);
};

const withRetries = async (fn, label) => {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === MAX_RETRIES) {
        throw error;
      }

      const delayMs = 600 * (attempt + 1);
      console.warn(
        `${label} temporary failure (${extractStatusCode(error)}). Retrying in ${delayMs}ms.`
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
};

const isConfigured = (value, placeholder) =>
  Boolean(value && value !== placeholder);

const hasGeminiKey = () =>
  isConfigured(process.env.GEMINI_API_KEY, "your_gemini_api_key_here");

const hasGroqKey = () =>
  isConfigured(process.env.GROQ_API_KEY, "your_groq_api_key_here");

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
    keypoints: `${prefix}extract the key points and main areas of concentration from this content for a student preparing to revise. Present the answer as short, clear bullet points. Focus on the most important facts, concepts, formulas, definitions, dates, or ideas to remember. Keep it concise and practical for revision:\n\n`,
  };

  return map[type];
};

const generateWithGemini = async ({ type, content, fileBase64, fileMimeType }) => {
  if (!hasGeminiKey()) {
    throw createHttpError(
      "Primary AI engine is not configured. Add GEMINI_API_KEY to enable it.",
      500
    );
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const promptText = buildPrompt(type, Boolean(fileBase64));

  const response = await withRetries(async () => {
    if (fileBase64) {
      return model.generateContent([
        { inlineData: { data: fileBase64, mimeType: fileMimeType } },
        promptText,
      ]);
    }

    return model.generateContent(`${promptText}${content.trim()}`);
  }, "Primary AI engine");

  return response.response.text();
};

const generateWithGroq = async ({ type, content, fileBase64, fileMimeType }) => {
  if (!hasGroqKey()) {
    throw createHttpError(
      "Backup AI engine is not configured. Add GROQ_API_KEY to enable it.",
      500
    );
  }

  const isImageInput = Boolean(fileBase64 && fileMimeType?.startsWith("image/"));
  const model = isImageInput
    ? "meta-llama/llama-4-scout-17b-16e-instruct"
    : "llama-3.1-8b-instant";

  const response = await withRetries(async () => {
    const apiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are StudyMate AI, a precise, student-friendly learning assistant. Follow the requested output format exactly.",
          },
          {
            role: "user",
            content: isImageInput
              ? [
                  { type: "text", text: buildPrompt(type, true) },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${fileMimeType};base64,${fileBase64}`,
                    },
                  },
                ]
              : `${buildPrompt(type, false)}${content.trim()}`,
          },
        ],
      }),
    });

    if (!apiResponse.ok) {
      let message = "Backup AI engine request failed.";

      try {
        const errorPayload = await apiResponse.json();
        message =
          errorPayload?.error?.message ||
          errorPayload?.message ||
          message;
      } catch {
        // Ignore JSON parsing failures and use the default message.
      }

      throw createHttpError(message, apiResponse.status);
    }

    const payload = await apiResponse.json();
    const text = payload?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      throw createHttpError("Backup AI engine returned an empty response.", 502);
    }

    return text;
  }, "Backup AI engine");

  return response;
};

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let type;
    let content;
    let fileBase64;
    let fileMimeType;
    let modelPreference = PRIMARY_ENGINE;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      type = formData.get("type");
      modelPreference = formData.get("modelPreference") || PRIMARY_ENGINE;
      const file = formData.get("file");

      if (!file || typeof file === "string") {
        return Response.json(
          { error: "No file received. Please upload a PDF or image." },
          { status: 400 }
        );
      }

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
      const body = await request.json();
      type = body.type;
      content = body.content;
      modelPreference = body.modelPreference || PRIMARY_ENGINE;

      if (!content || content.trim().length < 20) {
        return Response.json(
          { error: "Please provide at least 20 characters of content." },
          { status: 400 }
        );
      }
    }

    if (!VALID_TYPES.has(type)) {
      return Response.json(
        {
          error:
            "Invalid type. Must be: summary, explain, quiz, mindmap, flashcards, or keypoints.",
        },
        { status: 400 }
      );
    }

    if (![PRIMARY_ENGINE, BACKUP_ENGINE].includes(modelPreference)) {
      return Response.json(
        { error: "Invalid AI engine selection." },
        { status: 400 }
      );
    }

    if (fileBase64 && modelPreference === BACKUP_ENGINE && fileMimeType === "application/pdf") {
      return Response.json(
        {
          error:
            "Focus AI currently supports typed notes and uploaded images. For PDF documents, switch to Spark AI.",
        },
        { status: 400 }
      );
    }

    const payload = { type, content, fileBase64, fileMimeType };

    if (modelPreference === BACKUP_ENGINE) {
      const result = await generateWithGroq(payload);
      return Response.json({ result });
    }

    try {
      const result = await generateWithGemini(payload);
      return Response.json({ result });
    } catch (primaryError) {
      if (fileBase64 || !hasGroqKey()) {
        throw primaryError;
      }

      console.warn("Primary AI engine failed. Falling back to backup AI engine.", primaryError);
      const result = await generateWithGroq(payload);
      return Response.json({ result });
    }
  } catch (error) {
    console.error("AI route error:", error);

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
      { error: error.message || "Failed to generate a response. Please try again." },
      { status: status && status >= 400 ? status : 500 }
    );
  }
}
