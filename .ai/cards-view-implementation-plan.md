# Plan implementacji widoku "My Cards"

## 1. Przegląd

Widok "My Cards" (`/cards`) jest centralnym miejscem dla użytkownika do zarządzania swoimi fiszkami. Umożliwia przeglądanie wszystkich zapisanych fiszek (zarówno tych stworzonych ręcznie, jak i wygenerowanych przez AI), ręczne tworzenie nowych, edycję istniejących oraz ich usuwanie. Interfejs będzie zoptymalizowany pod kątem płynności działania dzięki optymistycznym aktualizacjom UI, a w wersji MVP będzie wyświetlał informację o limicie 50 ostatnio dodanych fiszek.

## 2. Routing widoku

- **Ścieżka Astro:** `src/pages/cards.astro`
- **URL:** `/cards`
- **Komponent kliencki:** Plik `.astro` załaduje główny komponent React, np. `MyCardsView.tsx`, z dyrektywą `client:load`.

## 3. Struktura komponentów

```
/cards.astro
└── MyCardsView.tsx (komponent kliencki)
    ├── Przycisk "Dodaj nową fiszkę"
    ├── Informacja o limicie "Wyświetlanie 50 najnowszych fiszek."
    ├── SavedCardGrid.tsx
    │   ├── (jeśli są fiszki) -> mapowanie listy i renderowanie <SavedCard />
    │   └── (jeśli brak fiszek) -> <EmptyState /> z zachętą do działania
    ├── ManualCardModal.tsx (kontrolowany przez stan w MyCardsView)
    ├── EditCardModal.tsx (kontrolowany przez stan w MyCardsView)
    └── DeleteConfirmationDialog.tsx (kontrolowany przez stan w MyCardsView)
```

## 4. Szczegóły komponentów

### `MyCardsView.tsx`

- **Opis komponentu:** Główny kontener widoku. Odpowiedzialny za pobieranie danych, zarządzanie stanem listy fiszek oraz kontrolowanie widoczności wszystkich modali. Wykorzysta customowy hook `useMyCards` do obsługi logiki biznesowej.
- **Główne elementy:** `Button` (Shadcn), `SavedCardGrid`, `ManualCardModal`, `EditCardModal`, `DeleteConfirmationDialog`.
- **Obsługiwane interakcje:** Otwieranie modala do tworzenia nowej fiszki, otwieranie modala do edycji po otrzymaniu zdarzenia z `SavedCardGrid`, otwieranie modala potwierdzenia usunięcia.
- **Typy:** `Flashcard[]`
- **Propsy:** Brak.

### `SavedCardGrid.tsx`

- **Opis komponentu:** Wyświetla responsywną siatkę (`grid`) komponentów `SavedCard`. Renderuje również stan pusty, gdy nie ma żadnych fiszek do wyświetlenia.
- **Główne elementy:** Siatka CSS (np. `div` z klasami Tailwind CSS), iteracja po liście fiszek, komponent `SavedCard`.
- **Obsługiwane interakcje:** Przekazuje zdarzenia `onEdit` i `onDelete` od dziecka (`SavedCard`) do rodzica (`MyCardsView`).
- **Typy:** `Flashcard[]`
- **Propsy:**
  ```typescript
  interface SavedCardGridProps {
    cards: Flashcard[];
    onEdit: (card: Flashcard) => void;
    onDelete: (card: Flashcard) => void;
  }
  ```

### `SavedCard.tsx`

- **Opis komponentu:** Reprezentuje pojedynczą fiszkę na siatce. Wyświetla jej przód i tył oraz przyciski akcji.
- **Główne elementy:** `Card`, `CardHeader`, `CardContent`, `CardFooter` (Shadcn), przyciski "Edytuj" i "Usuń".
- **Obsługiwane interakcje:** `onClick` na przyciskach "Edytuj" i "Usuń", które wywołują odpowiednie callbacki z propsów.
- **Typy:** `Flashcard`
- **Propsy:**
  ```typescript
  interface SavedCardProps {
    card: Flashcard;
    onEdit: (card: Flashcard) => void;
    onDelete: (card: Flashcard) => void;
  }
  ```

### `ManualCardModal.tsx` i `EditCardModal.tsx`

- **Opis komponentu:** Modale oparte na `Dialog` od Shadcn, zawierające formularz do tworzenia/edycji fiszki. Do budowy formularza zostaną użyte `react-hook-form`, `zod` do walidacji oraz komponent `Form` z Shadcn.
- **Główne elementy:** `Dialog`, `Form`, `Input`, `Textarea`, `Button`. Będą zawierać liczniki znaków dla pól `front` i `back`.
- **Obsługiwane interakcje:** Wprowadzanie tekstu, `onSubmit` formularza.
- **Obsługiwana walidacja:**
  - `front`: wymagane, 1-200 znaków, nie może składać się tylko z białych znaków.
  - `back`: wymagane, 1-500 znaków, nie może składać się tylko z białych znaków.
- **Typy:** `CreateFlashcardDTO`, `UpdateFlashcardDTO`, `Flashcard` (dla `EditCardModal`).
- **Propsy:**

  ```typescript
  // ManualCardModalProps
  interface ManualCardModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSubmit: (data: CreateFlashcardDTO) => void;
  }

  // EditCardModalProps
  interface EditCardModalProps {
    card: Flashcard | null; // null zamyka modal
    onOpenChange: (isOpen: boolean) => void;
    onSubmit: (id: number, data: UpdateFlashcardDTO) => void;
  }
  ```

### `DeleteConfirmationDialog.tsx`

- **Opis komponentu:** Prosty dialog potwierdzenia (`AlertDialog` z Shadcn) zapobiegający przypadkowemu usunięciu.
- **Główne elementy:** `AlertDialog`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogCancel`, `AlertDialogAction`.
- **Obsługiwane interakcje:** `onClick` na przycisku potwierdzającym i anulującym.
- **Typy:** `Flashcard`
- **Propsy:**
  ```typescript
  interface DeleteConfirmationDialogProps {
    card: Flashcard | null; // null zamyka modal
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (id: number) => void;
  }
  ```

## 5. Typy

```typescript
import { Database } from "@/db/database.types";

// Główny typ fiszki używany w UI (ViewModel)
export type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];

// DTO do tworzenia nowej, manualnej fiszki
export interface CreateFlashcardDTO {
  front: string;
  back: string;
  source: "manual";
  generation_id: null;
}

// DTO do aktualizacji istniejącej fiszki
export interface UpdateFlashcardDTO {
  front?: string;
  back?: string;
}
```

## 6. Zarządzanie stanem

Zarządzanie stanem zostanie scentralizowane w customowym hooku `useMyCards`, co uprości komponent `MyCardsView` i pozwoli na reużycie logiki.

- **Lokalizacja hooka:** `src/components/hooks/useMyCards.ts`
- **Struktura hooka:**

  ```typescript
  function useMyCards() {
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Funkcja do pobierania początkowych danych
    const fetchCards = useCallback(async () => {
      /* ... */
    }, []);

    // Funkcje do operacji CRUD zaimplementowane z logiką optymistyczną
    const addCard = async (data: CreateFlashcardDTO) => {
      /* ... */
    };
    const updateCard = async (id: number, data: UpdateFlashcardDTO) => {
      /* ... */
    };
    const deleteCard = async (id: number) => {
      /* ... */
    };

    // Inicjalne pobranie danych
    useEffect(() => {
      fetchCards();
    }, [fetchCards]);

    return { cards, isLoading, error, addCard, updateCard, deleteCard };
  }
  ```

- **Stan w `MyCardsView.tsx`:** Komponent będzie zarządzał jedynie stanem widoczności modali oraz przechowywał referencje do aktualnie edytowanej/usuwanej fiszki.
  ```typescript
  const [isManualModalOpen, setManualModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<Flashcard | null>(null);
  const [cardToDelete, setCardToDelete] = useState<Flashcard | null>(null);
  ```

## 7. Integracja API

Wszystkie wywołania API będą opakowane w funkcje serwisowe (np. w `src/lib/services/flashcard.service.ts`) i wykorzystywane wewnątrz hooka `useMyCards`.

- **`GET /api/flashcards?limit=50`**
  - **Żądanie:** Wykonywane przy inicjalizacji hooka.
  - **Odpowiedź:** `Promise<{ data: Flashcard[], pagination: any }>`
- **`POST /api/flashcards`**
  - **Żądanie:** `(payload: CreateFlashcardDTO) => Promise<Flashcard>`
- **`PATCH /api/flashcards/:id`**
  - **Żądanie:** `(id: number, payload: UpdateFlashcardDTO) => Promise<Flashcard>`
- **`DELETE /api/flashcards/:id`**
  - **Żądanie:** `(id: number) => Promise<{ deleted_id: number }>`

## 8. Interakcje użytkownika

1.  **Dodawanie fiszki:** Kliknięcie "Dodaj nową fiszkę" -> otwiera `ManualCardModal` -> wypełnienie i wysłanie formularza -> wywołanie `addCard` -> optymistyczne dodanie do siatki i zamknięcie modala.
2.  **Edycja fiszki:** Kliknięcie "Edytuj" na karcie -> otwiera `EditCardModal` z danymi -> modyfikacja i wysłanie formularza -> wywołanie `updateCard` -> optymistyczna aktualizacja w siatce i zamknięcie modala.
3.  **Usuwanie fiszki:** Kliknięcie "Usuń" na karcie -> otwiera `DeleteConfirmationDialog` -> kliknięcie "Potwierdź" -> wywołanie `deleteCard` -> optymistyczne usunięcie z siatki i zamknięcie dialogu.

## 9. Warunki i walidacja

- Walidacja formularzy (długość, zawartość pól `front` i `back`) będzie realizowana po stronie klienta za pomocą `zod` i `react-hook-form`.
- Przycisk "Zapisz" w modalach będzie nieaktywny, dopóki formularz nie będzie poprawny.
- Użytkownik otrzyma informację zwrotną o błędach walidacji bezpośrednio pod polami formularza.
- Liczniki znaków będą na bieżąco informować o wykorzystaniu limitu.

## 10. Obsługa błędów

- **Błąd pobierania danych:** `MyCardsView` wyświetli komunikat błędu zamiast siatki fiszek.
- **Błędy operacji CRUD:** Hook `useMyCards` przechwyci błędy z API.
  1.  Stan optymistyczny zostanie wycofany (np. usunięta fiszka powróci na listę).
  2.  Zostanie wyświetlone powiadomienie typu "toast" (np. przy użyciu `sonner` z Shadcn) z informacją o niepowodzeniu, np. "Nie udało się usunąć fiszki. Spróbuj ponownie."
  3.  Szczegóły błędu zostaną zalogowane w konsoli deweloperskiej.

## 11. Kroki implementacji

1.  Utworzenie pliku `src/pages/cards.astro` i osadzenie w nim pustego komponentu `src/components/MyCardsView.tsx` z `client:load`.
2.  Zaimplementowanie hooka `useMyCards` z logiką pobierania danych (`GET /api/flashcards?limit=50`).
3.  W `MyCardsView` wykorzystanie hooka `useMyCards` do wyświetlenia stanu ładowania, a następnie `SavedCardGrid` z pobranymi danymi.
4.  Stworzenie komponentów `SavedCardGrid` oraz `SavedCard` do wyświetlania listy fiszek.
5.  Dodanie przycisku "Dodaj nową fiszkę" i zaimplementowanie modala `ManualCardModal` z formularzem (`react-hook-form` + `zod`) i logiką walidacji.
6.  Zintegrowanie `ManualCardModal` z `MyCardsView` i podpięcie funkcji `addCard` z hooka, implementując logikę optymistyczną.
7.  Zaimplementowanie `EditCardModal` w analogiczny sposób, przekazując do niego dane wybranej fiszki.
8.  Podpięcie funkcji `updateCard` z hooka do `EditCardModal` z logiką optymistyczną.
9.  Zaimplementowanie `DeleteConfirmationDialog`.
10. Podpięcie funkcji `deleteCard` z hooka do `DeleteConfirmationDialog` z logiką optymistyczną.
11. Stylowanie wszystkich komponentów za pomocą Tailwind CSS, zgodnie z design systemem opartym na Shadcn/ui.
12. Finalne testy manualne wszystkich ścieżek użytkownika, w tym obsługi błędów i działania optymistycznego UI.
