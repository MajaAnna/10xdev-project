import type { APIRoute } from "astro";
import { OpenRouterService } from "../../lib/services/openrouter.service";
import { generationRequestSchema } from "../../lib/schemas/generation.schemas";
import type { OpenRouterRequest } from "../../types";

// This schema defines the expected JSON structure for generated flashcards.
// It is explicitly defined here for the API endpoint context.
const flashcardsSchema = {
  name: "generate_flashcards_from_text",
  strict: true,
  schema: {
    type: "object",
    properties: {
      flashcards: {
        type: "array",
        items: {
          type: "object",
          properties: {
            front: { type: "string" },
            back: { type: "string" },
          },
          required: ["front", "back"],
        },
      },
    },
    required: ["flashcards"],
  },
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const validation = generationRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowe dane wejściowe.", details: validation.error.flatten() }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { text, model } = validation.data;
    const openRouterService = new OpenRouterService();

    const openRouterRequest: OpenRouterRequest = {
      model: model || "openai/gpt-4o", // Use model from request or a default
      messages: [
        {
          role: "system",
          content:
            "Jesteś asystentem, który tworzy fiszki na podstawie dostarczonego tekstu. Zawsze odpowiadaj w formacie JSON zgodnym z podanym schematem. Upewnij się, że generujesz co najmniej 3 fiszki, a każda fiszka dotyczy istotnych informacji z tekstu.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: flashcardsSchema,
      },
      temperature: 0.2, // Lower temperature for more deterministic and factual responses
    };

    const response = await openRouterService.getChatCompletion(openRouterRequest);

    // Assuming the AI's response content is directly the JSON string we need
    const generatedContent = response.choices[0]?.message?.content;

    if (!generatedContent) {
      throw new Error("AI did not return any content.");
    }

    // Attempt to parse the content to ensure it's valid JSON before returning
    const parsedGeneratedContent = JSON.parse(generatedContent);

    return new Response(JSON.stringify(parsedGeneratedContent), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[API/Generations] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
    return new Response(
      JSON.stringify({
        error: "Wystąpił wewnętrzny błąd serwera.",
        details: errorMessage,
        stack:
          import.meta.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined, // Provide stack in development
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const prerender = false;
