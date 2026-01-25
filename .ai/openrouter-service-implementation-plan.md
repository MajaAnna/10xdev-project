# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis usługi

`OpenRouterService` to klasa TypeScript zaprojektowana do hermetyzacji komunikacji z API OpenRouter (`https://openrouter.ai/api/v1`). Umożliwia ona wysyłanie zapytań do różnych modeli językowych (LLM) i otrzymywanie odpowiedzi, w tym odpowiedzi ustrukturyzowanych w formacie JSON. Usługa ta będzie kluczowym elementem integracji funkcji AI w aplikacji, zgodnie ze stosem technologicznym opartym na Astro, React i Supabase.

## 2. Opis konstruktora

Konstruktor inicjalizuje serwis, pobierając klucz API OpenRouter z zmiennych środowiskowych. Rzuca błąd, jeśli klucz nie jest dostępny, co zapobiega próbom komunikacji z API bez autoryzacji.

```typescript
/**
 * Tworzy instancję OpenRouterService.
 * @throws {Error} Jeśli zmienna środowiskowa OPENROUTER_API_KEY nie jest ustawiona.
 */
constructor();
```

## 3. Publiczne metody i pola

### `async getChatCompletion(request: OpenRouterRequest): Promise<OpenRouterResponse>`

Jest to główna metoda publiczna usługi, która wysyła żądanie uzupełnienia czatu do API OpenRouter.

**Parametry:**

- `request` (`OpenRouterRequest`): Obiekt zawierający wszystkie niezbędne dane do żądania, w tym:
  - `model` (string): Nazwa modelu do użycia (np. `openai/gpt-4o`).
  - `messages` (Array): Tablica obiektów wiadomości (`{ role: 'system' | 'user', content: string }`).
  - `response_format` (Object, optional): Definicja formatu odpowiedzi, szczególnie do uzyskiwania JSON-a opartego na schemacie.
  - Inne parametry modelu, jak `temperature`, `max_tokens`, `top_p`.

**Zwraca:**

- `Promise<OpenRouterResponse>`: Obietnica, która rozwiązuje się do obiektu odpowiedzi z API, zawierającego wygenerowaną treść i inne metadane.

**Przykład użycia (Generowanie fiszek z tekstu):**

```typescript
// Ten schemat definiuje oczekiwaną strukturę JSON dla generowanych fiszek.
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
            front: { type: "string", description: "Treść przedniej strony fiszki." },
            back: { type: "string", description: "Treść tylnej strony fiszki." },
          },
          required: ["front", "back"],
        },
      },
    },
    required: ["flashcards"],
  },
};

const openRouterService = new OpenRouterService();
const userPastedText =
  "Fotosynteza to proces biochemiczny, w którym organizmy samożywne, takie jak rośliny, algi i niektóre bakterie, przekształcają energię świetlną w energię chemiczną, magazynowaną w postaci związków organicznych. Kluczowym barwnikiem jest chlorofil.";

try {
  const response = await openRouterService.getChatCompletion({
    // Model można będzie konfigurować w przyszłości
    model: "openai/gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "Jesteś asystentem, który tworzy fiszki na podstawie dostarczonego tekstu. Zawsze odpowiadaj w formacie JSON zgodnym z podanym schematem.",
      },
      {
        role: "user",
        content: userPastedText,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: flashcardsSchema,
    },
    temperature: 0.7,
  });

  const generatedData = JSON.parse(response.choices[0].message.content);
  console.log(generatedData.flashcards); // [{ front: "Czym jest fotosynteza?", back: "Procesem biochemicznym przekształcającym energię świetlną w chemiczną." }, ...]
} catch (error) {
  console.error("Błąd podczas generowania fiszek:", error);
}
```

## 4. Prywatne metody i pola

### `private readonly apiKey: string;`

Przechowuje klucz API OpenRouter pobrany z zmiennych środowiskowych.

### `private readonly baseUrl: string;`

Przechowuje bazowy URL do API OpenRouter (`https://openrouter.ai/api/v1/chat/completions`).

### `private async _fetchAPI(payload: object): Promise<any>`

Prywatna metoda pomocnicza, która używa `fetch` do wykonania rzeczywistego żądania HTTP POST do API. Odpowiada za ustawienie nagłówków autoryzacji i typu zawartości, a także za podstawową obsługę odpowiedzi HTTP.

## 5. Obsługa błędów

Usługa implementuje strategię obsługi błędów opartą na `early return` i `guard clauses`, rzucając dedykowane błędy w celu ułatwienia debugowania i zapewnienia spójności.

- **Błąd Konfiguracji:** Konstruktor rzuca `Error`, jeśli klucz API nie jest skonfigurowany.
- **Błędy API:** W przypadku nieudanej odpowiedzi z API (status HTTP inny niż 2xx), metoda `_fetchAPI` rzuci `Error` zawierający status oraz komunikat błędu zwrócony przez API OpenRouter. Pozwoli to na szczegółową obsługę błędów po stronie klienta (np. błędy 401, 400, 429, 5xx).
- **Błędy Sieciowe:** Błędy połączenia sieciowego będą rzucane przez `fetch` i powinny być przechwytywane w bloku `try...catch` otaczającym wywołanie `getChatCompletion`.

## 6. Kwestie bezpieczeństwa

- **Zarządzanie kluczem API:** Klucz API **nigdy** nie powinien być hardkodowany w kodzie źródłowym. Musi być przechowywany jako zmienna środowiskowa (`OPENROUTER_API_KEY`) i ładowany po stronie serwera. W środowisku Astro, wywołania API powinny być realizowane z endpointów (`src/pages/api`) lub w trakcie renderowania po stronie serwera (SSR), aby klucz API nie wyciekł do przeglądarki klienta.
- **Walidacja danych wejściowych:** Wszystkie dane pochodzące od użytkownika, które są przekazywane do `getChatCompletion`, powinny być walidowane i sanityzowane przed wysłaniem do API, aby zapobiec atakom typu prompt injection.

## 7. Plan wdrożenia krok po kroku

1.  **Konfiguracja zmiennej środowiskowej:**
    - Dodaj `OPENROUTER_API_KEY="twoj_klucz_api"` do pliku `.env` w głównym katalogu projektu. Upewnij się, że plik `.env` jest dodany do `.gitignore`.

2.  **Utworzenie pliku usługi:**
    - Stwórz nowy plik: `src/lib/services/openrouter.service.ts`.

3.  **Zdefiniowanie schematów walidacji i odpowiedzi (Zod):**
    - Stwórz nowy plik `src/lib/schemas/generation.schemas.ts`, aby zarządzać schematami dla generowania treści. Użycie Zod zapewni walidację typów w trakcie działania aplikacji.

      ```typescript
      // src/lib/schemas/generation.schemas.ts
      import { z } from "zod";

      export const flashcardGenerationSchema = z.object({
        front: z.string().min(1, "Pole 'front' nie może być puste."),
        back: z.string().min(1, "Pole 'back' nie może być puste."),
      });

      export const generationResponseSchema = z.object({
        flashcards: z.array(flashcardGenerationSchema),
      });

      export const generationRequestSchema = z.object({
        text: z.string().min(1, "Tekst do wygenerowania fiszek nie może być pusty."),
        model: z.string().min(1).optional(),
      });
      ```

4.  **Implementacja klasy `OpenRouterService`:**
    - Wklej poniższy kod do pliku `src/lib/services/openrouter.service.ts`. (Kod pozostaje taki sam jak w poprzedniej wersji planu, ponieważ jego zadaniem jest ogólna komunikacja z API).

      ```typescript
      // src/lib/services/openrouter.service.ts
      // ... implementacja OpenRouterService pozostaje bez zmian ...
      import type { OpenRouterRequest, OpenRouterResponse } from "../../types";

      export class OpenRouterService {
        private readonly apiKey: string;
        private readonly baseUrl = "https://openrouter.ai/api/v1/chat/completions";

        constructor() {
          const apiKey = import.meta.env.OPENROUTER_API_KEY;
          if (!apiKey) {
            console.error("Klucz API OpenRouter nie jest skonfigurowany.");
            throw new Error("Klucz API OpenRouter (OPENROUTER_API_KEY) nie jest ustawiony w zmiennych środowiskowych.");
          }
          this.apiKey = apiKey;
        }

        public async getChatCompletion(request: OpenRouterRequest): Promise<OpenRouterResponse> {
          // ... implementacja metody fetch pozostaje bez zmian ...
        }
      }
      ```

5.  **Utworzenie i użycie endpointu API dla generowania:**
    - Stwórz nowy, dedykowany endpoint w `src/pages/api/generations.ts`. Ten endpoint będzie obsługiwał logikę specyficzną dla generowania fiszek na podstawie tekstu.

      ```typescript
      // src/pages/api/generations.ts
      import type { APIRoute } from "astro";
      import { OpenRouterService } from "../../lib/services/openrouter.service";
      import { generationRequestSchema } from "../../lib/schemas/generation.schemas";

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
              { status: 400 }
            );
          }

          const { text, model } = validation.data;
          const openRouterService = new OpenRouterService();

          const response = await openRouterService.getChatCompletion({
            model: model || "openai/gpt-4o", // Użyj modelu z requestu lub domyślnego
            messages: [
              {
                role: "system",
                content:
                  "Jesteś asystentem, który tworzy fiszki na podstawie dostarczonego tekstu. Zawsze odpowiadaj w formacie JSON zgodnym z podanym schematem.",
              },
              { role: "user", content: text },
            ],
            response_format: {
              type: "json_schema",
              json_schema: flashcardsSchema,
            },
          });

          // Zwróć odpowiedź bezpośrednio do klienta
          return new Response(response.choices[0].message.content, {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error(error);
          const errorMessage = error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
          return new Response(JSON.stringify({ error: "Wystąpił wewnętrzny błąd serwera.", details: errorMessage }), {
            status: 500,
          });
        }
      };
      ```

    - Ten endpoint jest teraz gotowy do użycia przez frontend. Wystarczy wysłać żądanie POST na `/api/generations` z ciałem `{ "text": "..." }`.
