# Plan implementacji widoku: Flashcards Generator

## 1. Przegląd
Widok "Flashcards Generator" to centralne miejsce w aplikacji, przeznaczone do generowania fiszek za pomocą AI. Umożliwia użytkownikom wklejenie tekstu źródłowego, wygenerowanie na jego podstawie propozycji fiszek, a następnie ich przeglądanie, edycję i zapisywanie. Widok ten łączy w sobie formularz do generowania i interfejs do recenzji w jeden płynny proces, zgodnie z historiami użytkowników US-001 do US-005.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/generate`. Odpowiedni plik zostanie utworzony w strukturze projektu jako `src/pages/generate.astro`.

## 3. Struktura komponentów
Główna logika widoku zostanie zamknięta w jednym, nadrzędnym komponencie React, który będzie zarządzał stanem i komunikacją z API. Komponenty zostaną zbudowane z wykorzystaniem biblioteki `shadcn/ui`.

```
/generate.astro
└── FlashcardsGeneratorView (React Root)
    ├── GenerationForm
    ├── Spinner (wyświetlany warunkowo)
    └── CandidateReviewList (wyświetlany warunkowo)
        ├── Button ("Accept all")
        └── CandidateCard[]
            └── Button ("Delete")
    └── EditCandidateModal (wyświetlany warunkowo)
        ├── Textarea (front)
        ├── Textarea (back)
        └── Button ("Save and accept", "Reject", "Cancel")
```

## 4. Szczegóły komponentów
### FlashcardsGeneratorView
- **Opis komponentu**: Główny komponent React renderowany przez `generate.astro`. Zarządza całym stanem cyklu życia generowania fiszek: od formularza, przez ładowanie, aż po recenzję kandydatów.
- **Główne elementy**: Renderuje warunkowo `GenerationForm`, `Spinner`, `CandidateReviewList` oraz `EditCandidateModal` w zależności od aktualnego stanu (`idle`, `loading`, `reviewing`, `saving`, `error`).
- **Obsługiwane interakcje**:
    - Uruchamia proces generowania fiszek po otrzymaniu zdarzenia z `GenerationForm`.
    - Odbiera zdarzenia od komponentów podrzędnych w celu akceptacji (pojedynczej/masowej) lub odrzucenia kandydatów.
- **Typy**: `FlashcardCandidateVM`, `GenerationState` (`'idle' | 'loading' | 'reviewing' | 'saving' | 'error'`).
- **Propsy**: Brak.

### GenerationForm
- **Opis komponentu**: Formularz z polem `textarea` na tekst źródłowy oraz przyciskiem "Generate". Wyświetla licznik znaków i komunikaty walidacyjne.
- **Główne elementy**: `shadcn/ui/Textarea`, `shadcn/ui/Button`, elementy tekstowe dla licznika i błędów.
- **Obsługiwane interakcje**: `onSubmit(sourceText: string)` emitowane do komponentu nadrzędnego.
- **Obsługiwana walidacja**:
    - Długość tekstu źródłowego musi mieścić się w przedziale od 100 do 10 000 znaków.
    - Przycisk "Generate" jest nieaktywny, jeśli walidacja się nie powiedzie.
- **Typy**: `(sourceText: string) => void`.
- **Propsy**:
    - `isLoading: boolean` - do dezaktywacji formularza podczas generowania.
    - `onSubmit: (sourceText: string) => void` - funkcja zwrotna wywoływana po wysłaniu formularza.

### CandidateReviewList
- **Opis komponentu**: Kontener wyświetlający listę wygenerowanych kandydatów (`CandidateCard`) oraz przycisk do masowej akceptacji.
- **Główne elementy**: `shadcn/ui/Button` dla "Accept all", lista komponentów `CandidateCard`.
- **Obsługiwane interakcje**:
    - Kliknięcie "Accept all" emituje zdarzenie `onAcceptAll`.
    - Przekazuje zdarzenia `onDelete` i `onEdit` z poszczególnych `CandidateCard` do komponentu nadrzędnego.
- **Typy**: `FlashcardCandidateVM[]`.
- **Propsy**:
    - `candidates: FlashcardCandidateVM[]` - lista kandydatów do wyświetlenia.
    - `generationId: number` - ID sesji generowania.
    - `onAcceptAll: () => void`.
    - `onOpenEditModal: (candidate: FlashcardCandidateVM) => void`.
    - `onDeleteCandidate: (candidateId: string) => void`.

### CandidateCard
- **Opis komponentu**: Pojedynczy element na liście do recenzji. Wyświetla przód i tył fiszki, posiada ikonę do usunięcia.
- **Główne elementy**: `shadcn/ui/Card`, `shadcn/ui/Button` (dla ikony kosza).
- **Obsługiwane interakcje**:
    - Kliknięcie w dowolne miejsce karty emituje zdarzenie `onEdit`.
    - Kliknięcie w ikonę kosza emituje zdarzenie `onDelete`.
- **Typy**: `FlashcardCandidateVM`.
- **Propsy**:
    - `candidate: FlashcardCandidateVM`.
    - `onEdit: () => void`.
    - `onDelete: () => void`.

### EditCandidateModal
- **Opis komponentu**: Dialog (`shadcn/ui/Dialog`) do edycji pojedynczego kandydata. Zawiera formularz z polami na przód i tył oraz przyciski akcji.
- **Główne elementy**: `shadcn/ui/Dialog`, `shadcn/ui/Textarea`, `shadcn/ui/Button`.
- **Obsługiwane interakcje**:
    - Kliknięcie "Save and accept" emituje `onSave(editedCandidate, originalCandidate)`.
    - Kliknięcie "Reject" emituje `onReject(candidateId)`.
    - Kliknięcie "Cancel" lub zamknięcie dialogu emituje `onCancel`.
- **Obsługiwana walidacja**:
    - Długość `front`: od 1 do 200 znaków.
    - Długość `back`: od 1 do 500 znaków.
    - Przycisk "Save and accept" jest nieaktywny przy błędnej walidacji.
- **Typy**: `FlashcardCandidateVM`.
- **Propsy**:
    - `isOpen: boolean`.
    - `candidate: FlashcardCandidateVM | null`.
    - `onSave: (editedCandidate: FlashcardCandidateVM, originalCandidate: FlashcardCandidateVM) => void`.
    - `onReject: (candidateId: string) => void`.
    - `onCancel: () => void`.

## 5. Typy
Do implementacji widoku wymagane będą następujące typy, w tym dedykowany ViewModel dla kandydatów na fiszki.

- **`FlashcardCandidateDto`** (zgodny z `types.ts`, odpowiedź z API)
  ```typescript
  interface FlashcardCandidateDto {
    front: string;
    back: string;
  }
  ```

- **`FlashcardCandidateVM`** (ViewModel używany w stanie komponentu)
  - **Uzasadnienie**: Potrzebujemy unikalnego identyfikatora po stronie klienta, aby efektywnie zarządzać listą kandydatów (np. jako `key` w React, do usuwania), zanim zostaną zapisani do bazy danych.
  ```typescript
  interface FlashcardCandidateVM {
    id: string; // Wygenerowane po stronie klienta, np. crypto.randomUUID()
    front: string;
    back: string;
  }
  ```

- **`CreateFlashcardApiPayload`** (ciało żądania `POST /api/flashcards`)
  ```typescript
  interface CreateFlashcardApiPayload {
    front: string;
    back:string;
    source: 'ai_generated' | 'ai_generated_edited';
    generation_id: number;
  }
  ```

- **`BulkCreateFlashcardsApiPayload`** (ciało żądania `POST /api/flashcards/bulk`)
  ```typescript
  interface BulkCreateFlashcardsApiPayload {
    generation_id: number;
    flashcards: {
      front: string;
      back: string;
      source: 'ai_generated' | 'ai_generated_edited';
    }[];
  }
  ```

## 6. Zarządzanie stanem
Złożoność stanu (cykl życia, dane tymczasowe, stan ładowania, błędy) będzie zarządzana za pomocą customowego hooka `useFlashcardGenerator`.

```typescript
function useFlashcardGenerator() {
  const [state, setState] = useState<'idle' | 'loading' | 'reviewing' | 'saving' | 'error'>('idle');
  const [candidates, setCandidates] = useState<FlashcardCandidateVM[]>([]);
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [candidateToEdit, setCandidateToEdit] = useState<FlashcardCandidateVM | null>(null);

  // Akcje:
  // - generateCandidates(sourceText: string)
  // - acceptSingleCandidate(editedCandidate: FlashcardCandidateVM, originalCandidate: FlashcardCandidateVM)
  // - acceptAllCandidates()
  // - rejectCandidate(candidateId: string)
  // - openEditModal(candidate: FlashcardCandidateVM)
  // - closeEditModal()

  return { /* ...zmienne stanu i akcje */ };
}
```
Ten hook zostanie użyty wewnątrz komponentu `FlashcardsGeneratorView` do centralizacji logiki.

## 7. Integracja API
Komponent `FlashcardsGeneratorView` (za pośrednictwem hooka `useFlashcardGenerator`) będzie odpowiedzialny za komunikację z API.

1.  **Generowanie kandydatów**:
    - **Endpoint**: `POST /api/generations`
    - **Żądanie**: `{ source_text: string; model?: string; }`
    - **Odpowiedź (sukces)**: `GenerationResponseDto` (`{ generation_id, candidates, ... }`)
    - **Akcja**: Po pomyślnej odpowiedzi, stan jest aktualizowany o `generation_id` i listę `candidates` (przekonwertowaną na `FlashcardCandidateVM`).

2.  **Zapis pojedynczej fiszki**:
    - **Endpoint**: `POST /api/flashcards`
    - **Żądanie**: `CreateFlashcardApiPayload`
    - **Odpowiedź (sukces)**: `{ data: FlashcardDto }`
    - **Akcja**: Po zapisaniu, kandydat jest usuwany z lokalnej listy `candidates`.

3.  **Masowy zapis fiszek**:
    - **Endpoint**: `POST /api/flashcards/bulk`
    - **Żądanie**: `BulkCreateFlashcardsApiPayload`
    - **Odpowiedź (sukces)**: `{ data: BulkCreateFlashcardsResponseDto }`
    - **Akcja**: Po zapisaniu, lokalna lista `candidates` jest czyszczona.
    Masowy zapis fiszek nie jest obsługiwany na poziomie MVP - zostanie wdroony na późniejszych etapach. Na ten moment, po kliknięciu buttonu 'Save all' ma wyświetlić się toast z informacją, i ta funkcjonalność nie zostałą jeszcze zaimplementowana.

## 8. Interakcje użytkownika
- **Wpisywanie tekstu w `GenerationForm`**: Licznik znaków jest aktualizowany, a przycisk "Generate" jest włączany/wyłączany na podstawie walidacji.
- **Kliknięcie "Generate"**: Formularz znika, pojawia się `Spinner`. Po odpowiedzi z API, `Spinner` znika, a na jego miejscu pojawia się `CandidateReviewList`.
- **Kliknięcie ikony kosza przy `CandidateCard`**: Karta natychmiast znika z listy (aktualizacja stanu lokalnego).
- **Kliknięcie na `CandidateCard`**: Otwiera się `EditCandidateModal` z danymi tej karty.
- **Kliknięcie "Save and accept" w modalu**: Wywoływane jest API zapisu, kandydat znika z listy, a modal się zamyka. Wyświetlany jest toast z potwierdzeniem.
- **Kliknięcie "Reject" w modalu**: Kandydat znika z listy, a modal się zamyka.
- **Kliknięcie "Accept all"**: Wywoływane jest API do masowego zapisu, a lista kandydatów jest czyszczona. Wyświetlany jest toast.

## 9. Warunki i walidacja
Walidacja będzie realizowana na poziomie komponentów, aby zapobiec niepotrzebnym wywołaniom API, zgodnie ze schematami Zod zaimplementowanymi na backendzie.

- **`GenerationForm`**:
    - `source_text`: `string`, długość `min: 100`, `max: 10000`.
    - Stan przycisku "Generate" zależy od spełnienia tych warunków.

- **`EditCandidateModal`**:
    - `front`: `string`, długość `min: 1`, `max: 200`.
    - `back`: `string`, długość `min: 1`, `max: 500`.
    - Stan przycisku "Save and accept" zależy od spełnienia tych warunków.

## 10. Obsługa błędów
- **Błąd generowania (`POST /api/generations`)**: Stan aplikacji zmienia się na `error`. Wyświetlany jest komunikat błędu (np. "Przekroczono limit zapytań") i przycisk "Spróbuj ponownie", który resetuje stan do `idle`.
- **Błąd zapisu (pojedynczego lub masowego)**: Stan aplikacji wraca do `reviewing`. Wyświetlany jest nietrwały komunikat (toast), np. "Zapis nie powiódł się. Spróbuj ponownie". Stan listy kandydatów pozostaje niezmieniony, umożliwiając ponowną próbę.

## 11. Kroki implementacji
1.  **Stworzenie pliku strony**: Utworzenie pliku `src/pages/generate.astro`.
2.  **Implementacja komponentu `FlashcardsGeneratorView`**: Stworzenie głównego komponentu React, który będzie renderowany w pliku `.astro` z dyrektywą `client:load`.
3.  **Implementacja hooka `useFlashcardGenerator`**: Zdefiniowanie logiki zarządzania stanem, w tym zmiennych stanu i pustych funkcji-akcji.
4.  **Budowa komponentów UI**: Stworzenie komponentów `GenerationForm`, `CandidateReviewList`, `CandidateCard` i `EditCandidateModal` z użyciem `shadcn/ui`, przekazując do nich wymagane propsy i funkcje zwrotne.
5.  **Walidacja po stronie klienta**: Dodanie logiki walidacji do `GenerationForm` i `EditCandidateModal` zgodnie z wymaganiami.
6.  **Integracja z API**: Zaimplementowanie logiki wywołań `fetch` wewnątrz akcji hooka `useFlashcardGenerator` dla wszystkich trzech endpointów (`/generations`, `/flashcards`, `/flashcards/bulk`).
7.  **Połączenie logiki**: Połączenie interakcji użytkownika w komponentach z akcjami w hooku (np. `onSubmit` w `GenerationForm` wywołuje `generateCandidates`).
8.  **Obsługa stanu ładowania i błędów**: Implementacja warunkowego renderowania komponentu `Spinner` i komunikatów o błędach na podstawie zmiennej `state` z hooka. Dodanie obsługi toastów dla operacji zapisu.
9.  **Stylowanie i dopracowanie UX**: Dopracowanie wyglądu za pomocą TailwindCSS, zapewnienie płynnych przejść i responsywności.
10. **Testowanie manualne**: Przetestowanie wszystkich historyjek użytkownika (US-001 do US-005) w celu zapewnienia poprawnego działania.
