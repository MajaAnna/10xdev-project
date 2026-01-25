# Plan implementacji widoku Profil Użytkownika

## 1. Przegląd

Widok profilu użytkownika (`/profile`) będzie stanowił tymczasowe miejsce dla przyszłych funkcji zarządzania kontem. Będzie wyświetlał podstawowe informacje o zalogowanym użytkowniku (adres e-mail, data dołączenia) i oferował przycisk do wylogowania się z aplikacji.

## 2. Routing widoku

Widok powinien być dostępny pod ścieżką `/profile`.

## 3. Struktura komponentów

```
ProfilePage.astro
└── Layout.astro (standardowy układ strony)
    └── UserProfileView.tsx
        ├── UserProfileDisplay.tsx
        └── SignOutButton.tsx
```

## 4. Szczegóły komponentów

### `UserProfileView.tsx`

- **Opis komponentu:** Główny, interaktywny komponent React odpowiedzialny za zarządzanie stanem widoku profilu, pobieranie danych użytkownika z sesji Supabase oraz obsługę logiki wylogowania. Koordynuje wyświetlanie `UserProfileDisplay` i `SignOutButton`.
- **Główne elementy:** Wykorzystuje `Card` ze Shadcn/ui do grupowania zawartości. Zawiera `UserProfileDisplay` i `SignOutButton`. Będzie wyświetlał spinner podczas ładowania danych lub wylogowywania.
- **Obsługiwane interakcje:**
  - Wywołuje funkcję `signOut` po kliknięciu przycisku wylogowania.
- **Obsługiwana walidacja:**
  - Sprawdza, czy sesja użytkownika jest dostępna. W przypadku braku sesji, przekierowuje użytkownika do strony logowania.
- **Typy:** `UserProfileViewModel`
- **Propsy:** Brak (pobiera dane z kontekstu/hooków).

### `UserProfileDisplay.tsx`

- **Opis komponentu:** Komponent prezentacyjny wyświetlający adres e-mail i datę dołączenia użytkownika.
- **Główne elementy:** Proste elementy HTML (np. `div`, `p`) stylizowane za pomocą Tailwind CSS.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `UserProfileViewModel`
- **Propsy:**
  - `userProfile: UserProfileViewModel` - Obiekt zawierający dane profilu użytkownika do wyświetlenia.

### `SignOutButton.tsx`

- **Opis komponentu:** Przycisk umożliwiający użytkownikowi wylogowanie się z aplikacji.
- **Główne elementy:** Komponent `Button` ze Shadcn/ui.
- **Obsługiwane interakcje:**
  - `onClick`: Wywołuje funkcję `onSignOut` przekazaną w propsach.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:**
  - `onSignOut: () => void` - Funkcja wywoływana po kliknięciu przycisku.
  - `isLoading: boolean` - Wskazuje, czy operacja wylogowania jest w toku, aby wyświetlić stan ładowania.

## 5. Typy

### `UserProfileViewModel`

- **Opis:** Model widoku reprezentujący dane profilu użytkownika do wyświetlenia w interfejsie.
- **Pola:**
  - `email: string;` - Adres e-mail użytkownika.
  - `joinDate: string;` - Sformatowana data utworzenia konta użytkownika.

## 6. Zarządzanie stanem

Stan widoku profilu będzie zarządzany w komponencie `UserProfileView.tsx` za pomocą hooków `useState` i `useEffect`.

- `userProfile: UserProfileViewModel | null`: Przechowuje dane profilowe użytkownika. Początkowo `null`.
- `isLoading: boolean`: Wskazuje, czy dane są ładowane lub czy trwa proces wylogowywania. Początkowo `true`.
- `error: string | null`: Przechowuje ewentualny komunikat o błędzie. Początkowo `null`.

Do obsługi logiki uwierzytelniania zostanie użyty niestandardowy hook `useAuth` (jeśli jeszcze nie istnieje), który będzie opakowaniem dla `supabase.auth.getUser()` i `supabase.auth.signOut()`, udostępniając stan użytkownika, stan ładowania i funkcję wylogowania.

## 7. Integracja API

Brak dedykowanego endpointu API dla danych profilu użytkownika.

- **Pobieranie danych użytkownika:** Dane (email, data utworzenia konta) zostaną pobrane z sesji użytkownika za pomocą klienta Supabase: `supabase.auth.getUser()`.
  - **Typ żądania:** Brak bezpośredniego żądania HTTP.
  - **Typ odpowiedzi:** Obiekt `User` z biblioteki Supabase (zawierający `email` i `created_at`).
- **Wylogowanie:** Akcja wylogowania zostanie zrealizowana za pomocą klienta Supabase: `supabase.auth.signOut()`.
  - **Typ żądania:** Brak bezpośredniego żądania HTTP.
  - **Typ odpowiedzi:** Sukces/błąd operacji wylogowania.

## 8. Interakcje użytkownika

- **Dostęp do widoku profilu:** Użytkownik nawiguje do `/profile` poprzez kliknięcie ikony użytkownika w górnej nawigacji.
- **Wyświetlanie danych profilu:** Po załadowaniu strony, jeśli użytkownik jest zalogowany, jego adres e-mail i data dołączenia są wyświetlane.
- **Wylogowanie:** Użytkownik klika przycisk "Sign Out". Aplikacja wylogowuje użytkownika, a następnie przekierowuje go na stronę logowania (`/auth/login`).

## 9. Warunki i walidacja

- **Wymóg uwierzytelnienia:** Dostęp do strony `/profile` jest możliwy tylko dla zalogowanych użytkowników.
  - **Weryfikacja:** `middleware/index.ts` powinien przekierowywać niezalogowanych użytkowników do `/auth/login`. Dodatkowo, `UserProfileView.tsx` będzie sprawdzał status sesji użytkownika przy montowaniu komponentu i w przypadku braku sesji, przekieruje użytkownika.
- **Formatowanie daty:** Data `created_at` z obiektu użytkownika Supabase powinna być sformatowana w sposób przyjazny dla użytkownika (np. "16 stycznia 2026").

## 10. Obsługa błędów

- **Użytkownik niezalogowany / brak sesji:**
  - Strona (`ProfilePage.astro` lub `UserProfileView.tsx`) powinna wykryć brak sesji użytkownika i natychmiast przekierować do `/auth/login`.
- **Błąd podczas pobierania sesji użytkownika:**
  - W `UserProfileView.tsx` wyświetlony zostanie komunikat o błędzie (np. "Nie udało się załadować profilu użytkownika. Spróbuj ponownie.") oraz ewentualnie log do konsoli dla celów debugowania.
- **Błąd podczas wylogowywania:**
  - W przypadku niepowodzenia operacji `supabase.auth.signOut()`, wyświetlony zostanie tymczasowy komunikat (toast notification za pomocą `sonner` ze Shadcn/ui), informujący użytkownika o błędzie (np. "Wystąpił błąd podczas wylogowywania. Spróbuj ponownie."). Użytkownik pozostanie na stronie profilu.

## 11. Kroki implementacji

1. **Utwórz stronę Astro:** Stwórz `src/pages/profile.astro`.
2. **Utwórz komponent React `UserProfileView.tsx`:**
   - Będzie głównym kontenerem logiki i stanu.
   - Użyj `useEffect` do pobrania sesji użytkownika za pomocą `supabase.auth.getUser()` przy pierwszym renderowaniu.
   - Utwórz lokalne stany `userProfile`, `isLoading`, `error`.
   - Zaimplementuj funkcję `handleSignOut`, która wywoła `supabase.auth.signOut()` i przekieruje do `/auth/login`.
   - Wyświetl `Spinner` ze Shadcn/ui, gdy `isLoading` jest `true`.
   - W przypadku błędu wyświetl komunikat o błędzie.
3. **Utwórz komponent React `UserProfileDisplay.tsx`:**
   - Będzie komponentem czysto prezentacyjnym, przyjmującym `UserProfileViewModel` jako props.
   - Wyświetl `email` i `joinDate`, używając odpowiedniego formatowania daty.
4. **Utwórz komponent React `SignOutButton.tsx`:**
   - Będzie opakowaniem dla komponentu `Button` ze Shadcn/ui.
   - Przyjmie `onSignOut` i `isLoading` jako propsy.
5. **Zintegruj komponenty w `UserProfileView.tsx`:**
   - Renderuj `UserProfileDisplay` i `SignOutButton` wewnątrz `UserProfileView`.
6. **Zaktualizuj `Layout.astro` i nawigację:**
   - Upewnij się, że `Layout.astro` poprawnie otacza `UserProfileView`.
   - Zaktualizuj `TopNav.tsx` i `Hamburger Menu` (jeśli istnieją oddzielne implementacje), aby zawierały link do `/profile` (np. ikonę użytkownika).
7. **Dodaj typ `UserProfileViewModel` do `src/types.ts`:**
   - Zdefiniuj interfejs `UserProfileViewModel` zgodnie z punktem 5.
8. **Przetestuj funkcjonalność:**
   - Sprawdź, czy strona `/profile` ładuje się poprawnie dla zalogowanych użytkowników.
   - Zweryfikuj wyświetlanie adresu e-mail i daty dołączenia.
   - Przetestuj przycisk "Sign Out" i przekierowanie na stronę logowania.
   - Sprawdź zachowanie dla niezalogowanych użytkowników (powinni zostać przekierowani).
   - Sprawdź stany ładowania.
9. **Dostosuj stylizację:** Użyj Tailwind CSS i Shadcn/ui, aby dopasować wygląd do reszty aplikacji.
