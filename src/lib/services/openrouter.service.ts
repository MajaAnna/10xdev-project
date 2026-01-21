import type { OpenRouterRequest, OpenRouterResponse } from "../../types";

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl = "https://openrouter.ai/api/v1/chat/completions";

  /**
   * Creates an instance of OpenRouterService.
   * Loads the API key from server-side environment variables.
   * @throws {Error} If the OPENROUTER_API_KEY environment variable is not set.
   */
  constructor() {
    // In Astro, server-side environment variables are accessed via `import.meta.env`
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OpenRouter API key is not configured.");
      throw new Error("OpenRouter API key (OPENROUTER_API_KEY) is not set in environment variables.");
    }
    this.apiKey = apiKey;
  }

  /**
   * Sends a chat completion request to the OpenRouter API.
   * @param request The request data.
   * @returns A promise with the response from the API.
   * @throws {Error} In case of a network error or an API error.
   */
  public async getChatCompletion(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        // Try to parse the error, but don't fail if the body is not valid JSON
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || response.statusText;
        throw new Error(`OpenRouter API Error: ${response.status} ${errorMessage}`);
      }

      return (await response.json()) as OpenRouterResponse;
    } catch (error) {
      console.error("Error in OpenRouterService.getChatCompletion:", error);
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }
}
