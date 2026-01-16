# Plan implementacji widoku Study

## 1. Przegląd
Widok "Study" (`/study`) stanowi minimalistyczne, wolne od rozpraszaczy środowisko do nauki, w którym użytkownik może przeglądać swoje zapisane fiszki. Sesja polega na cyklicznym przechodzeniu przez karty, odsłanianiu odpowiedzi i prostej samoocenie, co stanowi podstawę dla przyszłej implementacji algorytmu powtórek.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką URL: `/study`. Odpowiedni plik strony zostanie utworzony w `src/pages/study.astro`.

## 3. Struktura komponentów
Hierarchia komponentów React, które zbudują widok, będzie renderowana przez główny komponent `StudyView`.

```
/src/pages/study.astro
└── /src/components/StudyView.tsx (client:load)
    ├── <Spinner /> (warunkowo, podczas ładowania)
    ├── <Alert /> (warunkowo, dla błędów lub braku fiszek)
    ├── <SessionEndMessage /> (warunkowo, po zakończeniu sesji)
    └── Aktywna sesja (gdy status jest 'ready'):
        ├── <StudyProgressBar />
        ├── <FlashcardViewer />
        └── <StudyControls />
```

## 4. Szczegóły komponentów

### `StudyView.tsx`
- **Opis komponentu**: Główny komponent zarządzający całym widokiem nauki. Wykorzystuje hook `useStudySession` do obsługi stanu i logiki, a następnie renderuje odpowiednie komponenty potomne w zależności od aktualnego stanu sesji (ładowanie, błąd, aktywna sesja, zakończona sesja).
- **Główne elementy**: Komponenty `Spinner`, `Alert`, `SessionEndMessage`, `StudyProgressBar`, `FlashcardViewer`, `StudyControls`.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji, deleguje je do komponentów potomnych.
- **Obsługiwana walidacja**: Sprawdza stan zwrócony przez hook (np. `status`, `error`), aby zdecydować, co renderować.
- **Typy**: `StudySessionState` (wewnętrznie, przez hooka).
- **Propsy**: Brak.

### `FlashcardViewer.tsx`
- **Opis komponentu**: Komponent prezentacyjny odpowiedzialny za wyświetlanie treści aktualnej fiszki. Pokazuje przód karty, a po otrzymaniu odpowiedniego propa, również jej tył.
- **Główne elementy**: Elementy `Card` z biblioteki `shadcn/ui` do stylizacji.
- **Obsługiwane interakcje**: Brak.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `FlashcardDto`.
- **Propsy**:
  - `card: FlashcardDto` - obiekt aktualnie wyświetlanej fiszki.
  - `isAnswerVisible: boolean` - flaga decydująca o wyświetleniu tyłu karty.

### `StudyControls.tsx`
- **Opis komponentu**: Wyświetla przyciski akcji dla użytkownika. Renderuje przycisk "Show Answer" lub przyciski "Don't Know" i "Know" w zależności od tego, czy odpowiedź na fiszce jest już widoczna.
- **Główne elementy**: Komponenty `Button` z `shadcn/ui`.
- **Obsługiwane interakcje**:
  - Kliknięcie "Show Answer".
  - Kliknięcie "Don't Know".
  - Kliknięcie "Know".
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak.
- **Propsy**:
  - `isAnswerVisible: boolean` - decyduje, który zestaw przycisków wyświetlić.
  - `onShowAnswer: () => void` - funkcja zwrotna wywoływana po kliknięciu "Show Answer".
  - `onEvaluate: (knewIt: boolean) => void` - funkcja zwrotna wywoływana po kliknięciu przycisku oceny.

### `StudyProgressBar.tsx`
- **Opis komponentu**: Prosty komponent tekstowy lub wizualny (np. z użyciem komponentu `Progress` z `shadcn/ui`) pokazujący postęp w sesji.
- **Główne elementy**: Tekst (np. "5 / 20") i/lub `Progress` bar.
- **Obsługiwane interakcje**: Brak.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak.
- **Propsy**:
  - `current: number` - numer aktualnej fiszki.
  - `total: number` - łączna liczba fiszek w sesji.

### `SessionEndMessage.tsx`
- **Opis komponentu**: Wyświetla komunikat o zakończeniu sesji wraz z opcjami dalszych działań.
- **Główne elementy**: Tekst informacyjny i dwa przyciski `Button` ("Restart", "Return to Generator").
- **Obsługiwane interakcje**:
  - Kliknięcie "Restart".
  - Kliknięcie "Return to Generator".
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak.
- **Propsy**:
  - `onRestart: () => void` - funkcja zwrotna do restartowania sesji.
  - `onGoToGenerator: () => void` - funkcja zwrotna do nawigacji do widoku generatora.

## 5. Typy
Do implementacji widoku wykorzystane zostaną istniejące typy. Nie ma potrzeby tworzenia nowych, złożonych modeli widoku.
- **`FlashcardDto`**: Podstawowy obiekt fiszki pobierany z API.
  ```typescript
  import type { Tables } from "./db/database.types";
  export type FlashcardEntity = Tables<"flashcards">;
  export type FlashcardDto = Omit<FlashcardEntity, "user_id">;
  ```
- **`ListFlashcardsResponseDto`**: Oczekiwana struktura odpowiedzi z endpointa listującego fiszki.
  ```typescript
  export interface ListFlashcardsResponseDto {
    data: FlashcardDto[];
    pagination: PaginationDto;
  }
  ```

## 6. Zarządzanie stanem
Cała logika i stan widoku `Study` zostaną zamknięte w niestandardowym hooku `useStudySession.ts`. Takie podejście jest zgodne z istniejącymi wzorcami w projekcie (np. `useMyCards.ts`) i zapewnia czystą separację logiki od prezentacji.

### Hook `useStudySession`
- **Przeznaczenie**: Zarządzanie całym cyklem życia sesji nauki, od pobrania danych, przez śledzenie postępów, aż po zakończenie i restart sesji.
- **Zarządzany stan**:
  - `status: 'loading' | 'error' | 'ready' | 'finished'`
  - `studyQueue: FlashcardDto[]` (przemieszana lista fiszek do nauki)
  - `currentIndex: number`
  - `isAnswerVisible: boolean`
  - `error: string | null`
- **Użycie**: Komponent `StudyView` wywoła ten hook, a następnie wykorzysta zwrócone z niego wartości stanu i akcje do renderowania interfejsu i obsługi interakcji.
- **Zwracane wartości**:
  ```typescript
  interface UseStudySessionReturn {
    status: 'loading' | 'error' | 'ready' | 'finished';
    error: string | null;
    currentCard?: FlashcardDto;
    isAnswerVisible: boolean;
    progress: {
      current: number;
      total: number;
    };
    actions: {
      showAnswer: () => void;
      evaluateCard: (knewIt: boolean) => void;
      restartSession: () => void;
    };
  }
  ```

## 7. Integracja API
- **Endpoint**: `GET /api/flashcards`
- **Proces**:
  1. W hooku `useStudySession`, `useEffect` zainicjuje pobieranie danych.
  2. Zostanie wysłane zapytanie `GET` na `/api/flashcards`.
  3. **Odpowiedź (sukces)**: Dane w formacie `ListFlashcardsResponseDto` zostaną przetworzone. Lista fiszek (`response.data`) zostanie przemieszana i zapisana w stanie `studyQueue`. Status sesji zostanie ustawiony na `ready`.
  4. **Odpowiedź (błąd)**: W przypadku błędu sieciowego lub statusu odpowiedzi innego niż 2xx, w stanie zostanie zapisany komunikat o błędzie, a status sesji ustawiony na `error`.

## 8. Interakcje użytkownika
- **Wejście na stronę**: Użytkownik widzi wskaźnik ładowania.
- **Kliknięcie "Show Answer"**: Odsłania tył fiszki. Zestaw przycisków zmienia się na "Don't Know" i "Know".
- **Kliknięcie "Don't Know" / "Know"**: Przechodzi do następnej fiszki w kolejce, pokazując jej przód. Pasek postępu aktualizuje się. Zestaw przycisków wraca do "Show Answer".
- **Ocena ostatniej fiszki**: Interfejs nauki jest zastępowany przez komunikat o zakończeniu sesji.
- **Kliknięcie "Restart"**: Sesja zaczyna się od nowa, wracając do pierwszej fiszki.
- **Kliknięcie "Return to Generator"**: Użytkownik jest przekierowywany na stronę `/generate`.

## 9. Warunki i walidacja
- Główna walidacja odbywa się po stronie hooka `useStudySession` w odpowiedzi na dane z API:
  - **Brak fiszek**: Jeśli `GET /api/flashcards` zwróci pustą tablicę, komponent `StudyView` wyświetli stosowny komunikat zamiast interfejsu nauki.
  - **Błąd API**: Jeśli zapytanie API się nie powiedzie, `StudyView` wyświetli komunikat o błędzie.

## 10. Obsługa błędów
- **Błąd ładowania fiszek**: Jeśli wywołanie `GET /api/flashcards` zwróci błąd, hook `useStudySession` ustawi `status: 'error'` i przekaże komunikat błędu. Komponent `StudyView` wyświetli go użytkownikowi za pomocą komponentu `Alert`, informując o problemie i sugerując odświeżenie strony.
- **Brak fiszek**: To nie jest błąd, lecz stan. Jeśli API zwróci pustą tablicę fiszek, `StudyView` wyświetli informację "Nie masz jeszcze żadnych fiszek do nauki" wraz z przyciskiem/linkiem prowadzącym do strony `/generate`, zachęcając do stworzenia pierwszych kart.

## 11. Kroki implementacji
1.  Utworzyć plik strony `src/pages/study.astro`.
2.  W pliku `study.astro`, zaimportować i wyrenderować komponent `StudyView.tsx` z dyrektywą `client:load`.
3.  Stworzyć plik `src/components/hooks/useStudySession.ts` i zaimplementować w nim logikę pobierania danych oraz zarządzania stanem sesji.
4.  Stworzyć komponent `src/components/StudyView.tsx`, który będzie używał hooka `useStudySession` i renderował warunkowo inne komponenty.
5.  Zaimplementować komponenty prezentacyjne: `FlashcardViewer.tsx`, `StudyControls.tsx`, `StudyProgressBar.tsx` oraz `SessionEndMessage.tsx` w katalogu `src/components/`.
6.  Dodać link do nawigacji w głównym layoucie (`src/layouts/Layout.astro` lub w komponencie nawigacji), aby użytkownik mógł dostać się do widoku `/study`.
7.  Przetestować ręcznie wszystkie przepływy: stan ładowania, obsługę błędu, scenariusz z brakiem fiszek, pełną sesję nauki, restart oraz nawigację po zakończeniu.
