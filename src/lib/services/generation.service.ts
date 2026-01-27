import type { SupabaseClient } from "../../db/supabase.client";
import type { FlashcardCandidateDto } from "../../types";
import { ServiceUnavailableError, RateLimitError, GenerationFailedError } from "../errors/generation.errors";
import { calculateMD5Hash } from "../utils/hash.utils";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_TIMEOUT = 60000; // 60 seconds

/**
 * Mock flashcard candidates for development/testing
 * Used when OPENROUTER_API_KEY is not set or MOCK_AI_SERVICE=true
 */
function generateMockCandidates(sourceText: string): FlashcardCandidateDto[] {
  const textLength = sourceText.length;
  const wordCount = sourceText.split(/\s+/).length;

  return [
    {
      front: "What is the main topic of this text?",
      back: `The text discusses a topic with approximately ${wordCount} words.`,
    },
    {
      front: "How long is the source text?",
      back: `The source text is ${textLength} characters long.`,
    },
    {
      front: "What is a key concept mentioned?",
      back: "This is a mock flashcard generated for testing purposes.",
    },
    {
      front: "Why is this topic important?",
      back: "Mock response: This helps understand the subject matter better.",
    },
    {
      front: "What should you remember about this?",
      back: "Mock response: Key points from the source material.",
    },
  ];
}

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface GenerateFlashcardsResult {
  generation_id: number;
  model: string;
  generation_duration: number;
  generated_count: number;
  candidates: FlashcardCandidateDto[];
}

/**
 * Creates system prompt for AI flashcard generation (or returns user prompt if system role not supported)
 */
function createUserPromptContent(sourceText: string): string {
  // Since 'system' role is not supported by models like google/gemma-3n-e2b-it,
  // we embed the instructions directly into the user message.
  return `Jesteś asystentem, który tworzy fiszki na podstawie dostarczonego tekstu. Dla każdej fiszki odpowiedź w formacie: "Front: [treść przodu fiszki] | Back: [treść tyłu fiszki]", oddzielając każdą fiszkę nową linią. Tekst do przetworzenia:\n\n${sourceText}`;
}

/**
 * Calls OpenRouter API to generate flashcard candidates
 * Falls back to mock data if API key is not configured or MOCK_AI_SERVICE is enabled
 */
async function callOpenRouterAPI(sourceText: string, model: string): Promise<FlashcardCandidateDto[]> {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  const useMock = !apiKey; // Mocks are now only used if API key is missing.

  // Use mock data for development/testing
  if (useMock) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
    return generateMockCandidates(sourceText);
  }

  const requestBody: OpenRouterRequest = {
    model,
    messages: [
      {
        role: "user",
        content: createUserPromptContent(sourceText),
      },
    ],
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT);

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle rate limiting
    if (response.status === 429) {
      throw new RateLimitError();
    }

    // Handle service unavailable
    if (response.status === 503) {
      throw new ServiceUnavailableError();
    }

    // Handle other HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new GenerationFailedError(`OpenRouter API returned status ${response.status}`, {
        status: response.status,
        body: errorText,
      });
    }

    const data: OpenRouterResponse = await response.json();

    // Parse AI response
    const candidates = parseAIResponse(data);

    return candidates;
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.name === "AbortError") {
      throw new ServiceUnavailableError("AI service request timed out. Please try again later.");
    }

    // Re-throw custom errors
    if (
      error instanceof RateLimitError ||
      error instanceof ServiceUnavailableError ||
      error instanceof GenerationFailedError
    ) {
      throw error;
    }

    // Handle unexpected errors
    throw new GenerationFailedError("Unexpected error during AI generation", error);
  }
}

/**
 * Parses OpenRouter API response into flashcard candidates array
 * Expects plain text in format: "Front: [content] | Back: [content]" per line.
 */
function parseAIResponse(response: OpenRouterResponse): FlashcardCandidateDto[] {
  try {
    if (!response.choices || response.choices.length === 0) {
      throw new Error("No choices in AI response");
    }

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error("AI response content is empty.");
    }

    const lines = content.split("\n").filter((line) => line.trim() !== "");

    const candidates: FlashcardCandidateDto[] = [];
    for (const line of lines) {
      const match = line.match(/^Front: (.+?) \| Back: (.+)$/);
      if (match) {
        candidates.push({ front: match[1].trim(), back: match[2].trim() });
      } else {
        console.warn(`Skipping malformed line in AI response: ${line}`);
      }
    }

    if (candidates.length === 0) {
      throw new Error("No flashcards could be parsed from AI response.");
    }

    return candidates;
  } catch (error) {
    throw new GenerationFailedError("Failed to parse AI response", error);
  }
}

/**
 * Creates a generation record in the database
 */
async function createGenerationRecord(
  supabase: SupabaseClient,
  data: {
    user_id: string;
    model: string;
    generation_duration: number;
    generated_count: number;
    source_text_hash: string;
    source_text_length: number;
  }
): Promise<number> {
  const { data: result, error } = await supabase
    .from("generations")
    .insert({
      user_id: data.user_id,
      model: data.model,
      generation_duration: data.generation_duration,
      generated_count: data.generated_count,
      accepted_unedited_count: 0,
      accepted_edited_count: 0,
      source_text_hash: data.source_text_hash,
      source_text_length: data.source_text_length,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create generation record: ${error.message}`);
  }

  if (!result) {
    throw new Error("Failed to create generation record: No result returned");
  }

  return result.id;
}

/**
 * Logs generation error to the database
 */
async function logGenerationError(
  supabase: SupabaseClient,
  data: {
    user_id: string;
    model: string;
    source_text_hash: string;
    source_text_length: number;
    error_code: string;
    error_message: string;
  }
): Promise<void> {
  const { error } = await supabase.from("generation_error_logs").insert({
    user_id: data.user_id,
    model: data.model,
    source_text_hash: data.source_text_hash,
    source_text_length: data.source_text_length,
    error_code: data.error_code,
    error_message: data.error_message,
  });

  if (error) {
    // Don't throw here - logging errors should not break the response
    console.error("Failed to create generation error log:", error);
  }
}

/**
 * Main service function: Generates flashcards and saves generation to database
 *
 * This function orchestrates the entire generation process:
 * 1. Calls OpenRouter API to generate flashcard candidates
 * 2. Saves successful generation to the database
 * 3. Returns generation result
 *
 * In case of errors, the error is logged to generation_error_logs (handled by caller)
 */
export async function generateFlashcards(
  supabase: SupabaseClient,
  params: {
    source_text: string;
    model: string;
    user_id: string;
  }
): Promise<GenerateFlashcardsResult> {
  const startTime = Date.now();
  const sourceTextHash = calculateMD5Hash(params.source_text);
  const sourceTextLength = params.source_text.length;

  try {
    // Call OpenRouter API asynchronously
    const candidates = await callOpenRouterAPI(params.source_text, params.model);

    // Calculate generation duration
    const generationDuration = Date.now() - startTime;

    // Create generation record
    const generationId = await createGenerationRecord(supabase, {
      user_id: params.user_id,
      model: params.model,
      generation_duration: generationDuration,
      generated_count: candidates.length,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
    });

    return {
      generation_id: generationId,
      model: params.model,
      generation_duration: generationDuration,
      generated_count: candidates.length,
      candidates,
    };
  } catch (error) {
    // Log error to database
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = "An unexpected error occurred";

    if (error instanceof RateLimitError) {
      errorCode = "RATE_LIMIT_EXCEEDED";
      errorMessage = error.message;
    } else if (error instanceof ServiceUnavailableError) {
      errorCode = "SERVICE_UNAVAILABLE";
      errorMessage = error.message;
    } else if (error instanceof GenerationFailedError) {
      errorCode = "GENERATION_FAILED";
      errorMessage = error.message;
    }

    // Log error (don't await - let it run in background)
    logGenerationError(supabase, {
      user_id: params.user_id,
      model: params.model,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      error_code: errorCode,
      error_message: errorMessage,
    });

    // Re-throw error for endpoint to handle
    throw error;
  }
}
