# Plan Testów - AI Cards

## 1. Wprowadzenie i Cele Testowania

### 1.1 Cel Dokumentu
Niniejszy dokument definiuje kompleksowy plan testów dla aplikacji **AI Cards** - inteligentnego generatora fiszek edukacyjnych. Plan ten ma na celu zapewnienie wysokiej jakości produktu poprzez systematyczne testowanie wszystkich kluczowych funkcjonalności, integracji oraz wydajności systemu.

### 1.2 Cele Testowania
- **Weryfikacja funkcjonalności**: Potwierdzenie, że wszystkie funkcje działają zgodnie ze specyfikacją
- **Zapewnienie jakości**: Identyfikacja i eliminacja defektów przed wdrożeniem produkcyjnym
- **Walidacja integracji**: Sprawdzenie poprawności komunikacji między komponentami systemu
- **Ocena wydajności**: Weryfikacja, że system spełnia wymagania wydajnościowe
- **Bezpieczeństwo**: Potwierdzenie, że dane użytkowników są odpowiednio chronione
- **Doświadczenie użytkownika**: Zapewnienie intuicyjnego i responsywnego interfejsu

### 1.3 Zakres Produktu
AI Cards to aplikacja webowa umożliwiająca:
- Generowanie fiszek przy użyciu sztucznej inteligencji z wklejonego tekstu
- Przeglądanie, akceptację, edycję i odrzucanie propozycji AI
- Ręczne tworzenie i edycję fiszek
- Zarządzanie kontem użytkownika z bezpieczną autentykacją
- Prosty tryb nauki do przeglądania zapisanych fiszek

### 1.4 Uwagi o Aktualnym Stanie MVP

**Ważne informacje dla testerów:**

#### 1.4.1 Tryb Nauki - Uproszczona Wersja
- **Przyciski "Don't Know" i "Know"**: Służą **tylko do nawigacji** między fiszkami (przejście do następnej fiszki)
- **Oceny NIE są zapisywane** w bazie danych
- **Przyszłość**: W kolejnych wersjach zostanie dodany algorytm spaced repetition, który będzie wykorzystywał zapisane oceny
- **Testowanie**: Testy powinny weryfikować tylko nawigację, nie zapisywanie ocen

#### 1.4.2 Masowa Akceptacja Fiszek
- **Status**: Przycisk "Accept all" **istnieje w UI**, ale **funkcjonalność nie jest jeszcze zaimplementowana**
- **Testowanie**: Należy **pominąć** testy masowej akceptacji w aktualnej wersji MVP
- **Workaround**: Użytkownicy muszą akceptować fiszki pojedynczo

#### 1.4.3 Email Verification
- **Supabase Auth**: Obsługuje wysyłanie emaili weryfikacyjnych automatycznie
- **Środowisko testowe**: Email verification może być **wyłączona** dla szybszych testów
- **Środowisko produkcyjne**: Email verification jest **zalecana** dla bezpieczeństwa
- **Testowanie**: Test email verification jest **opcjonalny** (TC-AUTH-007)

## 2. Zakres Testów

### 2.1 Funkcjonalności Objęte Testami

#### 2.1.1 Moduł Autentykacji i Autoryzacji
- Rejestracja nowych użytkowników
- Logowanie użytkowników
- Wylogowanie użytkowników
- Ochrona tras wymagających autoryzacji
- Zarządzanie sesjami użytkowników
- Row Level Security (RLS) w bazie danych

#### 2.1.2 Moduł Generowania Fiszek AI
- Generowanie fiszek z tekstu źródłowego (100-10000 znaków)
- Parsowanie odpowiedzi z OpenRouter API
- Obsługa różnych modeli AI
- Logowanie błędów generowania
- Walidacja danych wejściowych
- Obsługa limitów API i timeoutów

#### 2.1.3 Moduł Zarządzania Fiszkami
- Tworzenie fiszek ręcznych
- Akceptowanie fiszek z AI (bez edycji)
- Akceptowanie fiszek z AI (z edycją)
- Edycja istniejących fiszek
- Usuwanie fiszek
- Paginacja listy fiszek
- Filtrowanie według źródła (manual, ai_generated, ai_generated_edited)

#### 2.1.4 Moduł Nauki
- Przeglądanie fiszek w trybie nauki
- Odwracanie fiszek (front/back)
- Nawigacja między fiszkami za pomocą przycisków "Don't know" / "Know"
- Wyświetlanie postępu sesji
- Zakończenie sesji nauki
- **Uwaga MVP**: Przyciski "Don't know" i "Know" służą tylko do nawigacji (przejście do następnej fiszki). Oceny nie są zapisywane w bazie danych - funkcjonalność ta będzie rozwinięta w przyszłych wersjach z algorytmem spaced repetition.

#### 2.1.5 Moduł Profilu Użytkownika
- Wyświetlanie informacji o profilu
- Statystyki użytkownika (liczba fiszek)
- Data dołączenia

### 2.2 Funkcjonalności Wyłączone z Testów (Out of Scope)

#### 2.2.1 Funkcjonalności Poza Zakresem MVP (zgodnie z PRD)
- Zaawansowane algorytmy powtórek (SM-2)
- Import z plików PDF/DOCX
- Udostępnianie zestawów fiszek między użytkownikami
- Integracje z zewnętrznymi platformami edukacyjnymi
- Natywne aplikacje mobilne (iOS/Android)

#### 2.2.2 Funkcjonalności Jeszcze Nie Zaimplementowane w MVP
- **Masowa akceptacja fiszek** ("Accept all") - przycisk istnieje w UI, ale funkcjonalność nie jest jeszcze zaimplementowana
- **Zapisywanie ocen w trybie nauki** - przyciski "Don't Know" i "Know" służą tylko do nawigacji, oceny nie są zapisywane w bazie danych (będzie rozwinięte w przyszłych wersjach z algorytmem spaced repetition)

### 2.3 Środowiska Testowe
- **Środowisko deweloperskie**: Lokalne testy podczas rozwoju
- **Środowisko testowe**: Dedykowane środowisko do testów integracyjnych
- **Środowisko staging**: Środowisko przedprodukcyjne do testów akceptacyjnych
- **Środowisko produkcyjne**: Monitoring i testy smoke po wdrożeniu

## 3. Typy Testów do Przeprowadzenia

### 3.1 Testy Jednostkowe (Unit Tests)

#### 3.1.1 Cel
Weryfikacja poprawności działania pojedynczych funkcji i metod w izolacji.

#### 3.1.2 Zakres
- **Serwisy backendowe**:
  - `flashcard.service.ts`: createFlashcard, listFlashcards, updateFlashcard, deleteFlashcard, countFlashcardsForUser
  - `generation.service.ts`: generateFlashcards, parseAIResponse, createGenerationRecord
  - `openrouter.service.ts`: getChatCompletion
  
- **Walidacja schematów Zod**:
  - `flashcard.schemas.ts`: createFlashcardSchema, listFlashcardsQuerySchema, UpdateFlashcardSchema
  - `generation.schemas.ts`: generationRequestSchema
  
- **Funkcje pomocnicze**:
  - `hash.utils.ts`: calculateMD5Hash
  - Type guards: isAiGeneratedSource, isManualSource

#### 3.1.3 Narzędzia
- **Vitest** - framework do testów jednostkowych
- **@testing-library/react** - testy komponentów React
- **msw** (Mock Service Worker) - mockowanie API

#### 3.1.4 Kryteria Pokrycia
- Minimum 80% pokrycia kodu dla warstwy serwisowej
- 100% pokrycia dla krytycznych funkcji biznesowych (createFlashcard, generateFlashcards)

### 3.2 Testy Integracyjne (Integration Tests)

#### 3.2.1 Cel
Weryfikacja poprawności współpracy między komponentami systemu.

#### 3.2.2 Zakres
- **Integracja API z bazą danych**:
  - Endpoint `/api/flashcards` (POST, GET)
  - Endpoint `/api/flashcards/[id]` (PATCH, DELETE)
  - Endpoint `/api/generations` (POST)
  - Endpoint `/api/auth/login` (POST)
  - Endpoint `/api/auth/register` (POST)
  - Endpoint `/api/auth/logout` (POST)

- **Integracja z Supabase**:
  - Autentykacja użytkowników
  - Row Level Security (RLS)
  - Operacje CRUD na tabelach
  - Triggery (moddatetime)
  - Constraints i validacje na poziomie bazy

- **Integracja z OpenRouter API**:
  - Wysyłanie requestów
  - Parsowanie odpowiedzi
  - Obsługa błędów (429, 503, timeout)
  - Fallback do mock data

#### 3.2.3 Narzędzia
- **Vitest** - framework testowy
- **Supertest** - testowanie HTTP endpoints
- **Supabase Test Client** - testowanie z rzeczywistą bazą danych testową

#### 3.2.4 Podejście
- Użycie dedykowanej bazy danych testowej
- Setup/teardown dla każdego testu (czyszczenie danych)
- Testowanie z rzeczywistymi użytkownikami testowymi

### 3.3 Testy End-to-End (E2E Tests)

#### 3.3.1 Cel
Weryfikacja pełnych ścieżek użytkownika od początku do końca w rzeczywistym środowisku przeglądarki.

#### 3.3.2 Zakres
- **Scenariusz 1: Rejestracja i pierwsze logowanie**
  1. Użytkownik otwiera stronę rejestracji
  2. Wypełnia formularz rejestracji (email + hasło)
  3. System tworzy konto w Supabase Auth
  4. **Uwaga**: Email verification jest obsługiwany przez Supabase - w testach E2E można pominąć kliknięcie w link aktywacyjny, jeśli środowisko testowe ma wyłączoną weryfikację email
  5. Użytkownik jest przekierowany na stronę główną
  6. Weryfikacja wyświetlenia pustego stanu (brak fiszek)

- **Scenariusz 2: Generowanie fiszek z AI**
  1. Użytkownik przechodzi do strony generowania
  2. Wkleja tekst źródłowy (min. 100 znaków)
  3. Klika "Generuj fiszki"
  4. System wyświetla loader
  5. System wyświetla propozycje fiszek (kandydatów)
  6. Użytkownik akceptuje pojedyncze fiszki klikając na nie
  7. Weryfikacja zapisania fiszek w bazie
  8. **Uwaga MVP**: Funkcja "Accept all" (masowa akceptacja) nie jest jeszcze zaimplementowana - należy pominąć w testach

- **Scenariusz 3: Edycja fiszki z AI przed akceptacją**
  1. Użytkownik generuje fiszki
  2. Klika "Edytuj" przy jednej z propozycji
  3. Modyfikuje treść front/back
  4. Akceptuje edytowaną fiszkę
  5. Weryfikacja, że source = "ai_generated_edited"

- **Scenariusz 4: Ręczne tworzenie fiszki**
  1. Użytkownik przechodzi do "Moje Fiszki"
  2. Klika "Dodaj fiszkę ręcznie"
  3. Wypełnia formularz
  4. Zapisuje fiszkę
  5. Weryfikacja, że fiszka pojawia się na liście

- **Scenariusz 5: Edycja istniejącej fiszki**
  1. Użytkownik otwiera listę fiszek
  2. Klika "Edytuj" przy wybranej fiszce
  3. Modyfikuje treść
  4. Zapisuje zmiany
  5. Weryfikacja aktualizacji

- **Scenariusz 6: Usuwanie fiszki**
  1. Użytkownik otwiera listę fiszek
  2. Klika "Usuń" przy wybranej fiszce
  3. Potwierdza usunięcie w dialogu
  4. Weryfikacja usunięcia z listy

- **Scenariusz 7: Sesja nauki**
  1. Użytkownik przechodzi do trybu nauki (/study)
  2. Przegląda fiszki:
     - Widzi front fiszki
     - Klika "Show Answer" → widzi back fiszki
     - Klika "Don't Know" lub "Know" → przechodzi do następnej fiszki
  3. Nawiguje przez wszystkie fiszki
  4. Kończy sesję (po ostatniej fiszce)
  5. Weryfikacja wyświetlenia ekranu podsumowania
  6. **Uwaga MVP**: Przyciski "Don't Know" i "Know" służą tylko do nawigacji - oceny nie są zapisywane

- **Scenariusz 8: Wylogowanie**
  1. Użytkownik klika "Wyloguj"
  2. System kończy sesję
  3. Użytkownik jest przekierowany do strony logowania
  4. Weryfikacja braku dostępu do chronionych tras

#### 3.3.3 Narzędzia
- **Playwright** - framework do testów E2E
- **Playwright Test Runner** - uruchamianie testów w różnych przeglądarkach

#### 3.3.4 Przeglądarki
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit (Safari)
- Chrome Mobile (Android)
- Safari Mobile (iOS)

### 3.4 Testy Wydajnościowe (Performance Tests)

#### 3.4.1 Cel
Weryfikacja, że system spełnia wymagania wydajnościowe i skaluje się odpowiednio.

#### 3.4.2 Zakres
- **Testy obciążeniowe**:
  - Symulacja 100 równoczesnych użytkowników
  - Generowanie fiszek (najbardziej kosztowna operacja)
  - Tworzenie i pobieranie fiszek
  - Czas odpowiedzi API < 2s (95 percentyl)

- **Testy wydajności frontendu**:
  - First Contentful Paint (FCP) < 1.5s
  - Largest Contentful Paint (LCP) < 2.5s
  - Time to Interactive (TTI) < 3.5s
  - Cumulative Layout Shift (CLS) < 0.1

- **Testy wydajności bazy danych**:
  - Czas zapytania listFlashcards < 100ms (dla 1000 fiszek)
  - Czas zapytania createFlashcard < 50ms
  - Efektywność indeksów (idx_flashcards_user_created)

#### 3.4.3 Narzędzia
- **k6** - testy obciążeniowe API
- **Lighthouse** - audyt wydajności frontendu
- **PostgreSQL EXPLAIN ANALYZE** - analiza wydajności zapytań

#### 3.4.4 Metryki Sukcesu
- API response time (p95) < 2000ms
- Database query time (p95) < 100ms
- Frontend LCP < 2.5s
- Zero błędów przy 100 równoczesnych użytkownikach

### 3.5 Testy Bezpieczeństwa (Security Tests)

#### 3.5.1 Cel
Weryfikacja, że system jest odporny na typowe zagrożenia bezpieczeństwa.

#### 3.5.2 Zakres
- **Autentykacja i Autoryzacja**:
  - Próba dostępu do chronionych tras bez autentykacji
  - Próba dostępu do danych innych użytkowników
  - Weryfikacja Row Level Security (RLS)
  - Testowanie wygasania sesji

- **Walidacja Danych Wejściowych**:
  - SQL Injection (parametry zapytań)
  - XSS (Cross-Site Scripting) w polach tekstowych
  - Przekroczenie limitów długości pól
  - Nieprawidłowe typy danych

- **API Security**:
  - Rate limiting (ochrona przed nadużyciami)
  - CORS configuration
  - Proper error handling (nie ujawnianie szczegółów wewnętrznych)

- **Secrets Management**:
  - Weryfikacja, że klucze API nie są eksponowane
  - Proper environment variables handling

#### 3.5.3 Narzędzia
- **OWASP ZAP** - skanowanie podatności
- **Manual testing** - testy manualne scenariuszy ataku
- **Supabase RLS Testing** - weryfikacja polityk RLS

#### 3.5.4 Compliance
- OWASP Top 10 (2021)
- GDPR considerations (data privacy)

### 3.6 Testy Dostępności (Accessibility Tests)

#### 3.6.1 Cel
Zapewnienie, że aplikacja jest dostępna dla użytkowników z różnymi niepełnosprawnościami.

#### 3.6.2 Zakres
- **WCAG 2.1 Level AA**:
  - Nawigacja klawiaturą (Tab, Enter, Escape)
  - Screen reader compatibility
  - Kontrast kolorów (minimum 4.5:1)
  - Alternatywne teksty dla elementów interaktywnych
  - Focus indicators
  - ARIA labels i roles

- **Komponenty UI**:
  - Formularze (labels, error messages)
  - Buttony (accessible names)
  - Dialogi (focus trap, ESC to close)
  - Nawigacja (keyboard shortcuts)

#### 3.6.3 Narzędzia
- **axe-core** - automatyczne testy dostępności
- **NVDA/JAWS** - testy z czytnikami ekranu
- **Lighthouse Accessibility Audit**

#### 3.6.4 Kryteria Sukcesu
- Axe-core: 0 krytycznych błędów
- Lighthouse Accessibility Score: > 90
- Pełna nawigacja klawiaturą bez myszy

### 3.7 Testy Kompatybilności (Compatibility Tests)

#### 3.7.1 Cel
Weryfikacja, że aplikacja działa poprawnie na różnych platformach i urządzeniach.

#### 3.7.2 Zakres
- **Przeglądarki Desktop**:
  - Chrome (latest, latest-1)
  - Firefox (latest, latest-1)
  - Safari (latest, latest-1)
  - Edge (latest)

- **Przeglądarki Mobile**:
  - Chrome Mobile (Android)
  - Safari Mobile (iOS)

- **Rozdzielczości Ekranu**:
  - Mobile: 375x667 (iPhone SE)
  - Tablet: 768x1024 (iPad)
  - Desktop: 1920x1080 (Full HD)
  - Large Desktop: 2560x1440 (QHD)

- **Systemy Operacyjne**:
  - Windows 10/11
  - macOS (latest)
  - iOS (latest, latest-1)
  - Android (latest, latest-1)

#### 3.7.3 Narzędzia
- **BrowserStack** - testowanie na rzeczywistych urządzeniach
- **Playwright** - automatyczne testy cross-browser

### 3.8 Testy Regresji (Regression Tests)

#### 3.8.1 Cel
Zapewnienie, że nowe zmiany nie wprowadzają błędów do istniejących funkcjonalności.

#### 3.8.2 Zakres
- Automatyczne uruchamianie pełnego zestawu testów jednostkowych
- Automatyczne uruchamianie kluczowych testów E2E
- Smoke tests po każdym wdrożeniu

#### 3.8.3 Częstotliwość
- Po każdym pull request (CI/CD)
- Przed każdym wdrożeniem na staging
- Przed każdym wdrożeniem na production

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1 Moduł Autentykacji

#### TC-AUTH-001: Rejestracja Nowego Użytkownika (Happy Path)
**Priorytet**: Krytyczny  
**Typ**: Funkcjonalny, E2E

**Warunki Wstępne**:
- Aplikacja jest dostępna
- Użytkownik nie ma jeszcze konta
- **Środowisko testowe**: Email verification może być wyłączona w Supabase dla środowiska testowego

**Kroki**:
1. Przejdź do `/auth/register`
2. Wprowadź email: `test@example.com`
3. Wprowadź hasło: `SecurePass123!`
4. Wprowadź potwierdzenie hasła: `SecurePass123!`
5. Kliknij "Zarejestruj się"

**Oczekiwany Rezultat**:
- Konto zostaje utworzone w Supabase Auth
- Użytkownik jest przekierowany na stronę główną `/`
- Wyświetlany jest komunikat powitalny (toast notification)
- Użytkownik jest zalogowany (sesja aktywna)

**Uwagi dotyczące Email Verification**:
- **Środowisko testowe**: Jeśli email verification jest wyłączona, użytkownik może od razu się zalogować
- **Środowisko produkcyjne**: Supabase wysyła email z linkiem aktywacyjnym. Testowanie tego wymaga:
  - Dostępu do test email service (np. Mailhog, Mailtrap)
  - Lub manualnej weryfikacji w Supabase Dashboard
  - Lub wyłączenia email verification dla testów automatycznych

**Dane Testowe**:
```json
{
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```

---

#### TC-AUTH-002: Rejestracja z Istniejącym Emailem
**Priorytet**: Wysoki  
**Typ**: Funkcjonalny, Negatywny

**Warunki Wstępne**:
- Użytkownik `existing@example.com` już istnieje w systemie

**Kroki**:
1. Przejdź do `/auth/register`
2. Wprowadź email: `existing@example.com`
3. Wprowadź hasło: `SecurePass123!`
4. Kliknij "Zarejestruj się"

**Oczekiwany Rezultat**:
- Wyświetlany jest błąd: "User already registered"
- Użytkownik pozostaje na stronie rejestracji
- Konto nie zostaje utworzone

---

#### TC-AUTH-003: Logowanie z Poprawnymi Danymi
**Priorytet**: Krytyczny  
**Typ**: Funkcjonalny, E2E

**Warunki Wstępne**:
- Użytkownik `user@example.com` istnieje w systemie

**Kroki**:
1. Przejdź do `/auth/login`
2. Wprowadź email: `user@example.com`
3. Wprowadź hasło: `UserPass123!`
4. Kliknij "Zaloguj się"

**Oczekiwany Rezultat**:
- Użytkownik jest zalogowany
- Przekierowanie na stronę główną `/`
- Sesja jest aktywna
- Nawigacja wyświetla opcję "Wyloguj"

---

#### TC-AUTH-004: Logowanie z Nieprawidłowym Hasłem
**Priorytet**: Wysoki  
**Typ**: Funkcjonalny, Negatywny

**Kroki**:
1. Przejdź do `/auth/login`
2. Wprowadź email: `user@example.com`
3. Wprowadź hasło: `WrongPassword`
4. Kliknij "Zaloguj się"

**Oczekiwany Rezultat**:
- Wyświetlany jest błąd: "Invalid login credentials"
- Użytkownik pozostaje na stronie logowania
- Sesja nie zostaje utworzona

---

#### TC-AUTH-005: Ochrona Chronionych Tras
**Priorytet**: Krytyczny  
**Typ**: Bezpieczeństwo

**Warunki Wstępne**:
- Użytkownik nie jest zalogowany

**Kroki**:
1. Spróbuj uzyskać dostęp do `/generate`
2. Spróbuj uzyskać dostęp do `/cards`
3. Spróbuj uzyskać dostęp do `/study`
4. Spróbuj uzyskać dostęp do `/profile`

**Oczekiwany Rezultat**:
- Każda próba kończy się przekierowaniem na `/auth/login`
- Middleware blokuje dostęp
- Brak możliwości obejścia zabezpieczenia

---

#### TC-AUTH-006: Wylogowanie
**Priorytet**: Wysoki  
**Typ**: Funkcjonalny

**Warunki Wstępne**:
- Użytkownik jest zalogowany

**Kroki**:
1. Kliknij przycisk "Wyloguj" w nawigacji
2. Potwierdź wylogowanie (jeśli wymagane)

**Oczekiwany Rezultat**:
- Sesja zostaje zakończona
- Użytkownik jest przekierowany na `/auth/login`
- Próba dostępu do chronionych tras kończy się przekierowaniem
- Cookie sesji jest usuwane

---

#### TC-AUTH-007: Email Verification (Opcjonalny - dla środowisk z włączoną weryfikacją)
**Priorytet**: Średni  
**Typ**: Funkcjonalny, Integracyjny  
**Status**: OPCJONALNY - tylko jeśli email verification jest włączona

**Warunki Wstępne**:
- Email verification jest włączona w Supabase
- Dostęp do test email service (Mailhog, Mailtrap, lub podobnego)

**Kroki**:
1. Zarejestruj nowego użytkownika z emailem `test-verify@example.com`
2. Sprawdź inbox w test email service
3. Znajdź email od Supabase z tematem "Confirm your signup"
4. Skopiuj link aktywacyjny z emaila
5. Otwórz link w przeglądarce
6. Spróbuj się zalogować

**Oczekiwany Rezultat**:
- Email z linkiem aktywacyjnym został wysłany
- Link aktywacyjny jest poprawny (format: `https://[project].supabase.co/auth/v1/verify?...`)
- Kliknięcie linku aktywuje konto
- Po aktywacji, użytkownik może się zalogować
- Przed aktywacją, logowanie jest niemożliwe (błąd: "Email not confirmed")

**Uwagi**:
- Ten test jest **opcjonalny** w MVP
- W środowisku testowym można wyłączyć email verification dla szybszych testów
- W środowisku produkcyjnym email verification jest zalecana dla bezpieczeństwa
- Alternatywa: Manualna aktywacja kont w Supabase Dashboard podczas testów

---

### 4.2 Moduł Generowania Fiszek AI

#### TC-GEN-001: Generowanie Fiszek z Poprawnym Tekstem
**Priorytet**: Krytyczny  
**Typ**: Funkcjonalny, Integracyjny

**Warunki Wstępne**:
- Użytkownik jest zalogowany
- OPENROUTER_API_KEY jest skonfigurowany

**Kroki**:
1. Przejdź do `/generate`
2. Wklej tekst źródłowy (200 znaków):
   ```
   TypeScript to typowany nadzbiór JavaScriptu, który kompiluje się do czystego JavaScriptu. 
   Dodaje opcjonalne typy statyczne, klasy i moduły do JavaScriptu. 
   TypeScript może pomóc w wykrywaniu błędów na wczesnym etapie rozwoju.
   ```
3. Kliknij "Generuj fiszki"
4. Poczekaj na odpowiedź

**Oczekiwany Rezultat**:
- Wyświetlany jest loader podczas generowania
- System wywołuje OpenRouter API
- Zwracane są propozycje fiszek (3-5 sztuk)
- Każda fiszka ma wypełnione pola `front` i `back`
- Rekord generacji jest zapisany w tabeli `generations`
- `generation_id` jest przypisany do sesji

**Dane Testowe**:
```json
{
  "text": "TypeScript to typowany nadzbiór JavaScriptu...",
  "model": "google/gemma-3n-e2b-it:free"
}
```

---

#### TC-GEN-002: Generowanie z Tekstem Zbyt Krótkim
**Priorytet**: Wysoki  
**Typ**: Walidacja, Negatywny

**Kroki**:
1. Przejdź do `/generate`
2. Wklej tekst o długości 50 znaków
3. Kliknij "Generuj fiszki"

**Oczekiwany Rezultat**:
- Wyświetlany jest błąd walidacji: "Tekst musi mieć minimum 100 znaków"
- Request nie jest wysyłany do API
- Walidacja działa po stronie klienta (Zod schema)

---

#### TC-GEN-003: Generowanie z Tekstem Zbyt Długim
**Priorytet**: Wysoki  
**Typ**: Walidacja, Negatywny

**Kroki**:
1. Przejdź do `/generate`
2. Wklej tekst o długości 15000 znaków
3. Kliknij "Generuj fiszki"

**Oczekiwany Rezultat**:
- Wyświetlany jest błąd walidacji: "Tekst nie może przekraczać 10000 znaków"
- Request nie jest wysyłany do API

---

#### TC-GEN-004: Obsługa Błędu Rate Limit (429)
**Priorytet**: Średni  
**Typ**: Obsługa Błędów

**Warunki Wstępne**:
- OpenRouter API zwraca status 429 (rate limit exceeded)

**Kroki**:
1. Przejdź do `/generate`
2. Wklej poprawny tekst
3. Kliknij "Generuj fiszki"
4. API zwraca 429

**Oczekiwany Rezultat**:
- Wyświetlany jest komunikat: "Przekroczono limit zapytań. Spróbuj ponownie za chwilę."
- Błąd jest logowany w `generation_error_logs`
- Użytkownik może spróbować ponownie

---

#### TC-GEN-005: Obsługa Timeout API
**Priorytet**: Średni  
**Typ**: Obsługa Błędów

**Warunki Wstępne**:
- OpenRouter API nie odpowiada w ciągu 60 sekund

**Kroki**:
1. Przejdź do `/generate`
2. Wklej poprawny tekst
3. Kliknij "Generuj fiszki"
4. Czekaj na timeout

**Oczekiwany Rezultat**:
- Po 60 sekundach wyświetlany jest błąd: "Przekroczono czas oczekiwania. Spróbuj ponownie."
- Request jest anulowany (AbortController)
- Błąd jest logowany

---

#### TC-GEN-006: Fallback do Mock Data (Brak API Key)
**Priorytet**: Niski  
**Typ**: Funkcjonalny

**Warunki Wstępne**:
- OPENROUTER_API_KEY nie jest ustawiony

**Kroki**:
1. Przejdź do `/generate`
2. Wklej poprawny tekst
3. Kliknij "Generuj fiszki"

**Oczekiwany Rezultat**:
- System używa mock data zamiast API
- Zwracane są 5 przykładowych fiszek
- Symulowane jest opóźnienie (1-3 sekundy)
- Rekord generacji jest zapisany z model = "mock"

---

### 4.3 Moduł Zarządzania Fiszkami

#### TC-CARD-001: Akceptowanie Fiszki bez Edycji
**Priorytet**: Krytyczny  
**Typ**: Funkcjonalny, Integracyjny

**Warunki Wstępne**:
- Użytkownik wygenerował fiszki (generation_id = 123)
- Wyświetlane są propozycje

**Kroki**:
1. Kliknij "Akceptuj" przy pierwszej fiszce
2. Poczekaj na zapisanie

**Oczekiwany Rezultat**:
- Fiszka jest zapisana w tabeli `flashcards`
- `source` = "ai_generated"
- `generation_id` = 123
- `accepted_unedited_count` w tabeli `generations` zwiększa się o 1
- Fiszka znika z listy propozycji
- Wyświetlany jest toast: "Fiszka zapisana"

**Weryfikacja w Bazie**:
```sql
SELECT * FROM flashcards WHERE generation_id = 123 AND source = 'ai_generated';
SELECT accepted_unedited_count FROM generations WHERE id = 123;
```

---

#### TC-CARD-002: Akceptowanie Fiszki z Edycją
**Priorytet**: Krytyczny  
**Typ**: Funkcjonalny, Integracyjny

**Warunki Wstępne**:
- Użytkownik wygenerował fiszki (generation_id = 123)

**Kroki**:
1. Kliknij "Edytuj" przy pierwszej fiszce
2. Zmień treść `front` z "Co to jest TypeScript?" na "Czym jest TypeScript?"
3. Kliknij "Zapisz"

**Oczekiwany Rezultat**:
- Fiszka jest zapisana z edytowaną treścią
- `source` = "ai_generated_edited"
- `generation_id` = 123
- `accepted_edited_count` w tabeli `generations` zwiększa się o 1
- Fiszka znika z listy propozycji

**Weryfikacja w Bazie**:
```sql
SELECT * FROM flashcards WHERE generation_id = 123 AND source = 'ai_generated_edited';
SELECT accepted_edited_count FROM generations WHERE id = 123;
```

---

#### TC-CARD-003: Odrzucanie Fiszki
**Priorytet**: Wysoki  
**Typ**: Funkcjonalny

**Warunki Wstępne**:
- Użytkownik wygenerował fiszki

**Kroki**:
1. Kliknij "Odrzuć" przy pierwszej fiszce

**Oczekiwany Rezultat**:
- Fiszka znika z listy propozycji
- Fiszka NIE jest zapisana w bazie
- Liczniki w `generations` nie zmieniają się
- Brak komunikatu (cicha operacja)

---

#### TC-CARD-004: Tworzenie Fiszki Ręcznie
**Priorytet**: Krytyczny  
**Typ**: Funkcjonalny

**Warunki Wstępne**:
- Użytkownik jest zalogowany
- Użytkownik jest na stronie `/cards`

**Kroki**:
1. Kliknij "Dodaj fiszkę ręcznie"
2. Wprowadź front: "Co to jest React?"
3. Wprowadź back: "Biblioteka JavaScript do budowania interfejsów użytkownika"
4. Kliknij "Zapisz"

**Oczekiwany Rezultat**:
- Fiszka jest zapisana w tabeli `flashcards`
- `source` = "manual"
- `generation_id` = null
- Fiszka pojawia się na liście fiszek
- Wyświetlany jest toast: "Fiszka utworzona"

**Weryfikacja w Bazie**:
```sql
SELECT * FROM flashcards WHERE source = 'manual' AND generation_id IS NULL;
```

---

#### TC-CARD-005: Edycja Istniejącej Fiszki (Manual)
**Priorytet**: Wysoki  
**Typ**: Funkcjonalny

**Warunki Wstępne**:
- Fiszka o id=456 istnieje, source="manual"

**Kroki**:
1. Przejdź do `/cards`
2. Kliknij "Edytuj" przy fiszce id=456
3. Zmień front: "Co to jest Vue?"
4. Kliknij "Zapisz"

**Oczekiwany Rezultat**:
- Fiszka jest zaktualizowana
- `source` pozostaje "manual" (nie zmienia się)
- `updated_at` jest aktualizowany (trigger)
- Wyświetlany jest toast: "Fiszka zaktualizowana"

---

#### TC-CARD-006: Edycja Fiszki AI (ai_generated → ai_generated_edited)
**Priorytet**: Wysoki  
**Typ**: Funkcjonalny, Logika Biznesowa

**Warunki Wstępne**:
- Fiszka o id=789 istnieje, source="ai_generated"

**Kroki**:
1. Przejdź do `/cards`
2. Kliknij "Edytuj" przy fiszce id=789
3. Zmień back: "Nowa odpowiedź"
4. Kliknij "Zapisz"

**Oczekiwany Rezultat**:
- Fiszka jest zaktualizowana
- `source` zmienia się z "ai_generated" na "ai_generated_edited"
- `updated_at` jest aktualizowany
- Wyświetlany jest toast: "Fiszka zaktualizowana"

**Weryfikacja w Bazie**:
```sql
SELECT source FROM flashcards WHERE id = 789;
-- Expected: 'ai_generated_edited'
```

---

#### TC-CARD-007: Usuwanie Fiszki
**Priorytet**: Wysoki  
**Typ**: Funkcjonalny

**Warunki Wstępne**:
- Fiszka o id=456 istnieje

**Kroki**:
1. Przejdź do `/cards`
2. Kliknij "Usuń" przy fiszce id=456
3. Potwierdź usunięcie w dialogu

**Oczekiwany Rezultat**:
- Fiszka jest usunięta z bazy
- Fiszka znika z listy
- Wyświetlany jest toast: "Fiszka usunięta"

**Weryfikacja w Bazie**:
```sql
SELECT * FROM flashcards WHERE id = 456;
-- Expected: 0 rows
```

---

#### TC-CARD-008: Paginacja Listy Fiszek
**Priorytet**: Średni  
**Typ**: Funkcjonalny

**Warunki Wstępne**:
- Użytkownik ma 50 fiszek w bazie

**Kroki**:
1. Przejdź do `/cards`
2. Sprawdź, że wyświetlane są pierwsze 20 fiszek (page=1, limit=20)
3. Kliknij "Następna strona"
4. Sprawdź, że wyświetlane są fiszki 21-40

**Oczekiwany Rezultat**:
- Pierwsza strona: fiszki 1-20 (najnowsze)
- Druga strona: fiszki 21-40
- Trzecia strona: fiszki 41-50
- Paginacja działa poprawnie (offset calculation)
- Query używa indeksu `idx_flashcards_user_created`

---

#### TC-CARD-009: Walidacja Długości Pól (Front > 200 znaków)
**Priorytet**: Średni  
**Typ**: Walidacja, Negatywny

**Kroki**:
1. Kliknij "Dodaj fiszkę ręcznie"
2. Wprowadź front: (250 znaków)
3. Wprowadź back: "Odpowiedź"
4. Kliknij "Zapisz"

**Oczekiwany Rezultat**:
- Wyświetlany jest błąd: "Front nie może przekraczać 200 znaków"
- Fiszka nie jest zapisana
- Walidacja działa po stronie klienta (Zod) i serwera

---

#### TC-CARD-010: Walidacja Długości Pól (Back > 500 znaków)
**Priorytet**: Średni  
**Typ**: Walidacja, Negatywny

**Kroki**:
1. Kliknij "Dodaj fiszkę ręcznie"
2. Wprowadź front: "Pytanie"
3. Wprowadź back: (600 znaków)
4. Kliknij "Zapisz"

**Oczekiwany Rezultat**:
- Wyświetlany jest błąd: "Back nie może przekraczać 500 znaków"
- Fiszka nie jest zapisana

---

### 4.4 Moduł Nauki

#### TC-STUDY-001: Rozpoczęcie Sesji Nauki
**Priorytet**: Krytyczny  
**Typ**: Funkcjonalny

**Warunki Wstępne**:
- Użytkownik ma 10 fiszek w bazie

**Kroki**:
1. Przejdź do `/study`
2. Sprawdź wyświetlenie pierwszej fiszki

**Oczekiwany Rezultat**:
- Wyświetlana jest pierwsza fiszka (front)
- Pasek postępu: "1 / 10"
- Przycisk "Pokaż odpowiedź" jest widoczny
- Fiszki są losowo przetasowane

---

#### TC-STUDY-002: Odwracanie Fiszki (Front → Back)
**Priorytet**: Krytyczny  
**Typ**: Funkcjonalny

**Warunki Wstępne**:
- Sesja nauki jest aktywna
- Wyświetlana jest strona front

**Kroki**:
1. Kliknij "Show Answer"

**Oczekiwany Rezultat**:
- Wyświetlana jest strona back (tył fiszki)
- Przycisk "Show Answer" znika
- Pojawiają się dwa przyciski: "Don't Know" i "Know"
- Animacja odwracania (flip) jest płynna

---

#### TC-STUDY-003: Nawigacja Między Fiszkami za pomocą Przycisków Oceny
**Priorytet**: Krytyczny  
**Typ**: Funkcjonalny

**Warunki Wstępne**:
- Sesja nauki jest aktywna
- Użytkownik ma 10 fiszek
- Wyświetlana jest pierwsza fiszka (1/10)

**Kroki**:
1. Kliknij "Show Answer"
2. Sprawdź, że pojawiły się przyciski "Don't Know" i "Know"
3. Kliknij "Don't Know"
4. Sprawdź wyświetlenie drugiej fiszki (2/10)
5. Kliknij "Show Answer"
6. Kliknij "Know"
7. Sprawdź wyświetlenie trzeciej fiszki (3/10)

**Oczekiwany Rezultat**:
- Kliknięcie "Don't Know" powoduje przejście do następnej fiszki
- Kliknięcie "Know" powoduje przejście do następnej fiszki
- Pasek postępu aktualizuje się (1/10 → 2/10 → 3/10)
- Po przejściu do następnej fiszki, wyświetlany jest jej front (przód)
- Przyciski "Don't Know" i "Know" znikają, pojawia się przycisk "Show Answer"
- **Uwaga MVP**: Oceny (Don't Know/Know) NIE są zapisywane w bazie danych - służą tylko do nawigacji

---

#### TC-STUDY-004: Zakończenie Sesji Nauki
**Priorytet**: Wysoki  
**Typ**: Funkcjonalny

**Warunki Wstępne**:
- Użytkownik jest na ostatniej fiszce (10/10)
- Odpowiedź jest widoczna (kliknięto "Show Answer")

**Kroki**:
1. Kliknij "Don't Know" lub "Know"

**Oczekiwany Rezultat**:
- Wyświetlany jest ekran podsumowania (SessionEndMessage)
- Komunikat: "Ukończyłeś sesję nauki!" lub podobny
- Przycisk "Restart" do rozpoczęcia sesji od nowa
- Przycisk "Return to Generator" do przejścia na stronę /generate
- Pasek postępu pokazuje 10/10

---

#### TC-STUDY-005: Sesja Nauki bez Fiszek
**Priorytet**: Średni  
**Typ**: Edge Case

**Warunki Wstępne**:
- Użytkownik nie ma żadnych fiszek

**Kroki**:
1. Przejdź do `/study`

**Oczekiwany Rezultat**:
- Wyświetlany jest komunikat: "You have no cards to study."
- Link "Create some first!" prowadzący do /generate
- Brak wyświetlania pustej sesji nauki

---

#### TC-STUDY-006: Restart Sesji Nauki
**Priorytet**: Średni  
**Typ**: Funkcjonalny

**Warunki Wstępne**:
- Użytkownik ukończył sesję nauki (status = "finished")
- Wyświetlany jest ekran podsumowania

**Kroki**:
1. Kliknij przycisk "Restart"

**Oczekiwany Rezultat**:
- Sesja nauki rozpoczyna się od nowa
- Fiszki są ponownie przetasowane (shuffle)
- Wyświetlana jest pierwsza fiszka (1/10)
- Pasek postępu resetuje się do 1/10
- Wyświetlany jest front fiszki z przyciskiem "Show Answer"

---

### 4.5 Moduł Row Level Security (RLS)

#### TC-RLS-001: Izolacja Danych Użytkowników (Flashcards)
**Priorytet**: Krytyczny  
**Typ**: Bezpieczeństwo

**Warunki Wstępne**:
- User A (id=user-a-uuid) ma 5 fiszek
- User B (id=user-b-uuid) ma 3 fiszki

**Kroki**:
1. Zaloguj się jako User A
2. Wywołaj GET `/api/flashcards`
3. Zaloguj się jako User B
4. Wywołaj GET `/api/flashcards`

**Oczekiwany Rezultat**:
- User A widzi tylko swoje 5 fiszek
- User B widzi tylko swoje 3 fiszki
- RLS policy blokuje dostęp do fiszek innych użytkowników
- Zapytanie SQL zawiera `WHERE user_id = auth.uid()`

**Weryfikacja w Bazie**:
```sql
-- Jako User A
SELECT * FROM flashcards; -- Zwraca 5 wierszy

-- Jako User B
SELECT * FROM flashcards; -- Zwraca 3 wiersze
```

---

#### TC-RLS-002: Próba Edycji Fiszki Innego Użytkownika
**Priorytet**: Krytyczny  
**Typ**: Bezpieczeństwo, Negatywny

**Warunki Wstępne**:
- User A ma fiszkę id=123
- User B jest zalogowany

**Kroki**:
1. Zaloguj się jako User B
2. Wywołaj PATCH `/api/flashcards/123` z nową treścią

**Oczekiwany Rezultat**:
- Request zwraca 404 Not Found (fiszka nie istnieje dla User B)
- Fiszka User A nie jest modyfikowana
- RLS policy blokuje operację UPDATE

---

#### TC-RLS-003: Próba Usunięcia Fiszki Innego Użytkownika
**Priorytet**: Krytyczny  
**Typ**: Bezpieczeństwo, Negatywny

**Warunki Wstępne**:
- User A ma fiszkę id=123
- User B jest zalogowany

**Kroki**:
1. Zaloguj się jako User B
2. Wywołaj DELETE `/api/flashcards/123`

**Oczekiwany Rezultat**:
- Request zwraca 404 Not Found
- Fiszka User A nie jest usunięta
- RLS policy blokuje operację DELETE

---

#### TC-RLS-004: Izolacja Danych Generacji
**Priorytet**: Wysoki  
**Typ**: Bezpieczeństwo

**Warunki Wstępne**:
- User A ma generation_id=100
- User B próbuje utworzyć fiszkę z generation_id=100

**Kroki**:
1. Zaloguj się jako User B
2. Wywołaj POST `/api/flashcards` z generation_id=100

**Oczekiwany Rezultat**:
- Request zwraca 404 Not Found: "Generation not found"
- Funkcja `validateGenerationOwnership` wykrywa naruszenie
- Fiszka nie jest tworzona

---

## 5. Środowisko Testowe

### 5.1 Infrastruktura

#### 5.1.1 Środowisko Deweloperskie (Local)
- **URL**: `http://localhost:4321`
- **Baza danych**: Supabase Local (Docker)
- **AI Service**: Mock data (OPENROUTER_API_KEY opcjonalny)
- **Cel**: Szybkie iteracje podczas rozwoju

#### 5.1.2 Środowisko Testowe (Test)
- **URL**: `https://test.aicards.example.com`
- **Baza danych**: Supabase Test Project
- **AI Service**: OpenRouter API (test account)
- **Cel**: Testy integracyjne i E2E

#### 5.1.3 Środowisko Staging
- **URL**: `https://staging.aicards.example.com`
- **Baza danych**: Supabase Staging Project
- **AI Service**: OpenRouter API (production account)
- **Cel**: Testy akceptacyjne przed wdrożeniem

#### 5.1.4 Środowisko Produkcyjne
- **URL**: `https://aicards.example.com`
- **Baza danych**: Supabase Production Project
- **AI Service**: OpenRouter API (production account)
- **Cel**: Smoke tests po wdrożeniu, monitoring

### 5.2 Dane Testowe

#### 5.2.1 Użytkownicy Testowi
```json
[
  {
    "email": "test.user1@example.com",
    "password": "TestPass123!",
    "role": "standard_user",
    "flashcards_count": 50
  },
  {
    "email": "test.user2@example.com",
    "password": "TestPass123!",
    "role": "standard_user",
    "flashcards_count": 0
  },
  {
    "email": "test.admin@example.com",
    "password": "AdminPass123!",
    "role": "admin",
    "flashcards_count": 100
  }
]
```

#### 5.2.2 Przykładowe Fiszki
```json
[
  {
    "front": "Co to jest TypeScript?",
    "back": "Typowany nadzbiór JavaScriptu",
    "source": "manual"
  },
  {
    "front": "Co to jest React?",
    "back": "Biblioteka JavaScript do budowania UI",
    "source": "ai_generated"
  },
  {
    "front": "Co to jest Supabase?",
    "back": "Open-source alternatywa dla Firebase",
    "source": "ai_generated_edited"
  }
]
```

#### 5.2.3 Teksty Źródłowe do Generowania
```
Tekst 1 (200 znaków):
"TypeScript to typowany nadzbiór JavaScriptu, który kompiluje się do czystego JavaScriptu. 
Dodaje opcjonalne typy statyczne, klasy i moduły do JavaScriptu. 
TypeScript może pomóc w wykrywaniu błędów na wczesnym etapie rozwoju."

Tekst 2 (500 znaków):
"React to biblioteka JavaScript do budowania interfejsów użytkownika. 
Została stworzona przez Facebook i jest używana do tworzenia aplikacji jednostronicowych. 
React używa komponentów, które są niezależnymi, wielokrotnego użytku elementami UI. 
Komponenty mogą być funkcyjne lub klasowe. React używa Virtual DOM do optymalizacji wydajności. 
Hooks to funkcje pozwalające używać stanu i innych funkcji React w komponentach funkcyjnych."
```

### 5.3 Konfiguracja Środowiska

#### 5.3.1 Zmienne Środowiskowe (Test)
```env
# Supabase
PUBLIC_SUPABASE_URL=https://test-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=test-anon-key

# OpenRouter
OPENROUTER_API_KEY=test-api-key

# Environment
NODE_ENV=test
```

#### 5.3.2 Skrypty Setup
```bash
# Setup testowej bazy danych
npm run db:test:setup

# Seed testowych danych
npm run db:test:seed

# Cleanup po testach
npm run db:test:teardown
```

## 6. Narzędzia do Testowania

### 6.1 Framework Testowy

#### 6.1.1 Vitest
- **Wersja**: ^1.0.0
- **Zastosowanie**: Testy jednostkowe i integracyjne
- **Konfiguracja**: `vitest.config.ts`
- **Komendy**:
  ```bash
  npm run test          # Uruchom wszystkie testy
  npm run test:unit     # Tylko testy jednostkowe
  npm run test:watch    # Tryb watch
  npm run test:coverage # Raport pokrycia
  ```

#### 6.1.2 Playwright
- **Wersja**: ^1.40.0
- **Zastosowanie**: Testy E2E
- **Przeglądarki**: Chromium, Firefox, WebKit
- **Komendy**:
  ```bash
  npm run test:e2e           # Uruchom testy E2E
  npm run test:e2e:headed    # Z widoczną przeglądarką
  npm run test:e2e:debug     # Tryb debug
  ```

### 6.2 Narzędzia Pomocnicze

#### 6.2.1 Testing Library
- **@testing-library/react**: Testy komponentów React
- **@testing-library/user-event**: Symulacja interakcji użytkownika
- **@testing-library/jest-dom**: Custom matchers

#### 6.2.2 MSW (Mock Service Worker)
- **Zastosowanie**: Mockowanie API w testach
- **Konfiguracja**: `src/mocks/handlers.ts`

#### 6.2.3 Faker.js
- **Zastosowanie**: Generowanie danych testowych
- **Przykład**:
  ```typescript
  import { faker } from '@faker-js/faker';
  
  const testUser = {
    email: faker.internet.email(),
    password: faker.internet.password()
  };
  ```

### 6.3 Narzędzia CI/CD

#### 6.3.1 GitHub Actions
- **Workflow**: `.github/workflows/test.yml`
- **Triggery**: Push, Pull Request
- **Jobs**:
  - Lint (ESLint)
  - Unit Tests (Vitest)
  - E2E Tests (Playwright)
  - Build

#### 6.3.2 Przykładowy Workflow
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:e2e
```

### 6.4 Narzędzia Wydajnościowe

#### 6.4.1 k6
- **Zastosowanie**: Testy obciążeniowe API
- **Skrypt**: `tests/load/api-load-test.js`
- **Komenda**:
  ```bash
  k6 run tests/load/api-load-test.js
  ```

#### 6.4.2 Lighthouse CI
- **Zastosowanie**: Audyt wydajności frontendu
- **Konfiguracja**: `lighthouserc.json`
- **Komenda**:
  ```bash
  npm run lighthouse
  ```

### 6.5 Narzędzia Bezpieczeństwa

#### 6.5.1 OWASP ZAP
- **Zastosowanie**: Skanowanie podatności
- **Tryb**: Automated scan
- **Raport**: HTML, JSON

#### 6.5.2 npm audit
- **Zastosowanie**: Skanowanie zależności
- **Komenda**:
  ```bash
  npm audit
  npm audit fix
  ```

### 6.6 Narzędzia Dostępności

#### 6.6.1 axe-core
- **Zastosowanie**: Automatyczne testy dostępności
- **Integracja**: Playwright, Vitest
- **Przykład**:
  ```typescript
  import { injectAxe, checkA11y } from 'axe-playwright';
  
  test('accessibility check', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    await checkA11y(page);
  });
  ```

#### 6.6.2 NVDA/JAWS
- **Zastosowanie**: Manualne testy z czytnikami ekranu
- **Platformy**: Windows (NVDA), macOS (VoiceOver)

## 7. Harmonogram Testów

### 7.1 Faza 1: Przygotowanie (Tydzień 1)
- **Dzień 1-2**: Setup środowisk testowych
  - Konfiguracja Supabase Test Project
  - Setup GitHub Actions
  - Instalacja narzędzi testowych
  
- **Dzień 3-4**: Przygotowanie danych testowych
  - Utworzenie użytkowników testowych
  - Seed danych do bazy testowej
  - Przygotowanie mock data dla AI
  
- **Dzień 5**: Dokumentacja i szkolenie
  - Przegląd planu testów z zespołem
  - Szkolenie z narzędzi testowych

### 7.2 Faza 2: Testy Jednostkowe (Tydzień 2)
- **Dzień 1-2**: Testy serwisów
  - flashcard.service.ts
  - generation.service.ts
  - openrouter.service.ts
  
- **Dzień 3-4**: Testy walidacji
  - Schematy Zod
  - Type guards
  - Funkcje pomocnicze
  
- **Dzień 5**: Raport pokrycia
  - Analiza pokrycia kodu
  - Uzupełnienie brakujących testów

### 7.3 Faza 3: Testy Integracyjne (Tydzień 3)
- **Dzień 1-2**: Testy API endpoints
  - /api/flashcards
  - /api/generations
  - /api/auth/*
  
- **Dzień 3-4**: Testy integracji z Supabase
  - RLS policies
  - Triggers
  - Constraints
  
- **Dzień 5**: Testy integracji z OpenRouter
  - Happy path
  - Error handling
  - Timeout scenarios

### 7.4 Faza 4: Testy E2E (Tydzień 4)
- **Dzień 1-2**: Scenariusze użytkownika
  - Rejestracja i logowanie
  - Generowanie fiszek
  - Zarządzanie fiszkami
  
- **Dzień 3-4**: Scenariusze zaawansowane
  - Sesja nauki
  - Edycja i usuwanie
  - Edge cases
  
- **Dzień 5**: Testy cross-browser
  - Chrome, Firefox, Safari
  - Mobile browsers

### 7.5 Faza 5: Testy Niefunkcjonalne (Tydzień 5)
- **Dzień 1**: Testy wydajnościowe
  - Load testing (k6)
  - Frontend performance (Lighthouse)
  
- **Dzień 2**: Testy bezpieczeństwa
  - OWASP ZAP scan
  - RLS verification
  - Penetration testing
  
- **Dzień 3**: Testy dostępności
  - axe-core automated tests
  - Screen reader testing
  
- **Dzień 4**: Testy kompatybilności
  - BrowserStack testing
  - Różne rozdzielczości
  
- **Dzień 5**: Raport końcowy
  - Podsumowanie wyników
  - Lista znalezionych defektów

### 7.6 Faza 6: Testy Regresji (Ciągłe)
- **Przed każdym PR**: Automatyczne testy jednostkowe i lint
- **Przed wdrożeniem na staging**: Pełny zestaw testów
- **Przed wdrożeniem na production**: Smoke tests + krytyczne E2E
- **Po wdrożeniu**: Monitoring i smoke tests

### 7.7 Kamienie Milowe

| Milestone | Data Docelowa | Kryteria Sukcesu |
|-----------|---------------|------------------|
| M1: Setup środowisk | Koniec tygodnia 1 | Wszystkie środowiska działają |
| M2: Testy jednostkowe | Koniec tygodnia 2 | Pokrycie > 80% |
| M3: Testy integracyjne | Koniec tygodnia 3 | Wszystkie API działają poprawnie |
| M4: Testy E2E | Koniec tygodnia 4 | Kluczowe scenariusze przechodzą |
| M5: Testy niefunkcjonalne | Koniec tygodnia 5 | Spełnione kryteria wydajności i bezpieczeństwa |
| M6: Gotowość do produkcji | Koniec tygodnia 6 | Wszystkie testy przechodzą, 0 krytycznych błędów |

## 8. Kryteria Akceptacji Testów

### 8.1 Kryteria Wejścia (Entry Criteria)

Przed rozpoczęciem testów muszą być spełnione następujące warunki:

#### 8.1.1 Dokumentacja
- [ ] Plan testów zatwierdzony przez Product Ownera
- [ ] Specyfikacja techniczna dostępna i aktualna
- [ ] API documentation (endpoints, schemas) kompletna

#### 8.1.2 Środowisko
- [ ] Środowisko testowe skonfigurowane i dostępne
- [ ] Baza danych testowa zawiera seed data
- [ ] Wszystkie zmienne środowiskowe ustawione
- [ ] OpenRouter API test account aktywny

#### 8.1.3 Kod
- [ ] Kod przeszedł code review
- [ ] Brak błędów kompilacji
- [ ] Linter (ESLint) nie zgłasza błędów
- [ ] Build produkcyjny działa

#### 8.1.4 Zespół
- [ ] Testerzy przeszkoleni z narzędzi
- [ ] Dostęp do wszystkich niezbędnych systemów
- [ ] Kanał komunikacji (Slack/Discord) aktywny

### 8.2 Kryteria Wyjścia (Exit Criteria)

Testy można uznać za zakończone, gdy:

#### 8.2.1 Pokrycie Testów
- [ ] Pokrycie kodu testami jednostkowymi ≥ 80%
- [ ] Wszystkie krytyczne scenariusze E2E przechodzą
- [ ] 100% API endpoints przetestowanych

#### 8.2.2 Jakość
- [ ] 0 defektów krytycznych (P0)
- [ ] ≤ 5 defektów wysokiego priorytetu (P1)
- [ ] Wszystkie defekty P0 i P1 naprawione lub zaakceptowane

#### 8.2.3 Wydajność
- [ ] API response time (p95) < 2000ms
- [ ] Lighthouse Performance Score > 85
- [ ] Brak memory leaks

#### 8.2.4 Bezpieczeństwo
- [ ] OWASP ZAP scan: 0 krytycznych podatności
- [ ] RLS policies zweryfikowane
- [ ] Wszystkie secrets zabezpieczone

#### 8.2.5 Dostępność
- [ ] axe-core: 0 krytycznych błędów
- [ ] Lighthouse Accessibility Score > 90
- [ ] Pełna nawigacja klawiaturą możliwa

#### 8.2.6 Dokumentacja
- [ ] Raport z testów wygenerowany
- [ ] Wszystkie defekty udokumentowane w Jira/GitHub Issues
- [ ] Test cases zaktualizowane

### 8.3 Kryteria Akceptacji dla Poszczególnych Typów Testów

#### 8.3.1 Testy Jednostkowe
- **Pokrycie**: ≥ 80% dla warstwy serwisowej
- **Czas wykonania**: < 30 sekund dla całego zestawu
- **Stabilność**: 0 flaky tests

#### 8.3.2 Testy Integracyjne
- **Pokrycie**: 100% API endpoints
- **Czas wykonania**: < 5 minut
- **Izolacja**: Każdy test działa niezależnie

#### 8.3.3 Testy E2E
- **Pokrycie**: Wszystkie user stories z MVP
- **Czas wykonania**: < 15 minut
- **Cross-browser**: Przechodzą na Chrome, Firefox, Safari

#### 8.3.4 Testy Wydajnościowe
- **Load test**: 100 równoczesnych użytkowników bez błędów
- **Response time**: p95 < 2000ms, p99 < 5000ms
- **Throughput**: ≥ 100 requests/second

#### 8.3.5 Testy Bezpieczeństwa
- **Vulnerabilities**: 0 High/Critical
- **Authentication**: Wszystkie chronione trasy zabezpieczone
- **RLS**: 100% izolacja danych użytkowników

### 8.4 Definicje Priorytetów Defektów

#### P0 - Krytyczny (Blocker)
- Aplikacja nie uruchamia się
- Utrata danych użytkownika
- Naruszenie bezpieczeństwa (data leak)
- Brak możliwości logowania/rejestracji
- **SLA**: Naprawa w ciągu 24h

#### P1 - Wysoki (Critical)
- Kluczowa funkcjonalność nie działa (generowanie fiszek)
- Błąd uniemożliwiający ukończenie user story
- Poważny błąd wydajnościowy (timeout > 30s)
- **SLA**: Naprawa w ciągu 3 dni

#### P2 - Średni (Major)
- Funkcjonalność działa, ale z ograniczeniami
- Błąd UI (niepoprawne wyświetlanie)
- Błąd walidacji (niepoprawny komunikat)
- **SLA**: Naprawa w ciągu 1 tygodnia

#### P3 - Niski (Minor)
- Kosmetyczne błędy UI
- Sugestie ulepszeń
- Błędy w dokumentacji
- **SLA**: Naprawa w backlogu

### 8.5 Metryki Sukcesu

#### 8.5.1 Metryki Jakości
- **Defect Density**: < 5 defektów / 1000 linii kodu
- **Test Pass Rate**: ≥ 95% testów przechodzi
- **Code Coverage**: ≥ 80% dla kodu produkcyjnego

#### 8.5.2 Metryki Wydajności
- **Mean Time to Detect (MTTD)**: < 1 dzień
- **Mean Time to Resolve (MTTR)**: < 3 dni (dla P1)
- **Test Execution Time**: < 20 minut (pełny zestaw)

#### 8.5.3 Metryki Procesu
- **Test Automation Rate**: ≥ 70% testów zautomatyzowanych
- **Test Maintenance Effort**: < 20% czasu testerów
- **Regression Test Coverage**: 100% krytycznych ścieżek

## 9. Role i Odpowiedzialności w Procesie Testowania

### 9.1 QA Lead (Lider Testów)
**Osoba**: [Imię Nazwisko]

**Odpowiedzialności**:
- Planowanie strategii testów
- Koordynacja zespołu testerów
- Przegląd i zatwierdzanie planu testów
- Raportowanie postępów do Product Ownera
- Zarządzanie ryzykiem jakościowym
- Decyzje go/no-go przed wdrożeniem

**Zaangażowanie**: 100% (pełny etat)

### 9.2 QA Engineer (Inżynier Testów)
**Osoby**: [Imiona Nazwiska - 2-3 osoby]

**Odpowiedzialności**:
- Tworzenie i wykonywanie test cases
- Automatyzacja testów (Vitest, Playwright)
- Raportowanie defektów w GitHub Issues
- Weryfikacja poprawek (re-testing)
- Testy regresji
- Współpraca z developerami

**Zaangażowanie**: 100% (pełny etat)

### 9.3 Automation Engineer (Inżynier Automatyzacji)
**Osoba**: [Imię Nazwisko]

**Odpowiedzialności**:
- Rozwój frameworka testowego
- Konfiguracja CI/CD (GitHub Actions)
- Maintenance testów automatycznych
- Performance testing (k6, Lighthouse)
- Monitoring i alerting

**Zaangażowanie**: 50% (współdzielone z innymi projektami)

### 9.4 Security Tester (Tester Bezpieczeństwa)
**Osoba**: [Imię Nazwisko] lub zewnętrzny konsultant

**Odpowiedzialności**:
- Testy penetracyjne
- Weryfikacja RLS policies
- OWASP ZAP scanning
- Security code review
- Raport bezpieczeństwa

**Zaangażowanie**: 20% (konsultacje)

### 9.5 Developer (Deweloper)
**Zespół**: [Zespół developerski]

**Odpowiedzialności**:
- Tworzenie testów jednostkowych dla własnego kodu
- Naprawa defektów
- Code review z perspektywy testowalności
- Współpraca z QA przy reprodukcji błędów
- Unit tests maintenance

**Zaangażowanie**: 15% czasu na testy

### 9.6 Product Owner
**Osoba**: [Imię Nazwisko]

**Odpowiedzialności**:
- Zatwierdzanie planu testów
- Priorytetyzacja defektów
- Decyzje o akceptacji ryzyka
- Akceptacja UAT (User Acceptance Testing)
- Decyzje go/no-go

**Zaangażowanie**: 10% (przeglądy i decyzje)

### 9.7 DevOps Engineer
**Osoba**: [Imię Nazwisko]

**Odpowiedzialności**:
- Setup środowisk testowych
- Konfiguracja CI/CD pipelines
- Monitoring infrastruktury testowej
- Troubleshooting problemów środowiskowych

**Zaangażowanie**: 20%

### 9.8 Macierz RACI

| Aktywność | QA Lead | QA Engineer | Automation Engineer | Security Tester | Developer | Product Owner | DevOps |
|-----------|---------|-------------|---------------------|-----------------|-----------|---------------|--------|
| Plan testów | A/R | C | C | C | C | A | I |
| Test cases | A | R | C | I | C | I | I |
| Automatyzacja | A | C | R | I | C | I | C |
| Wykonanie testów | A | R | C | I | C | I | I |
| Defect reporting | A | R | C | C | I | I | I |
| Defect fixing | I | C | I | I | R | I | C |
| Security testing | C | C | C | R | C | I | C |
| Performance testing | A | C | R | I | C | I | C |
| UAT | C | C | I | I | I | R/A | I |
| Go/No-Go decision | C | C | I | C | I | R/A | C |

**Legenda**:
- **R** (Responsible): Osoba wykonująca zadanie
- **A** (Accountable): Osoba odpowiedzialna za rezultat
- **C** (Consulted): Osoba konsultowana
- **I** (Informed): Osoba informowana

## 10. Procedury Raportowania Błędów

### 10.1 Narzędzie do Zarządzania Defektami

**Platforma**: GitHub Issues (zintegrowane z repozytorium)

**Alternatywy**: Jira, Linear, Notion

### 10.2 Szablon Zgłoszenia Defektu

```markdown
## 🐛 Bug Report

### Tytuł
[Krótki, opisowy tytuł - max 80 znaków]

### Priorytet
- [ ] P0 - Krytyczny (Blocker)
- [ ] P1 - Wysoki (Critical)
- [ ] P2 - Średni (Major)
- [ ] P3 - Niski (Minor)

### Środowisko
- **URL**: [np. https://test.aicards.example.com]
- **Przeglądarka**: [Chrome 120, Firefox 121, Safari 17]
- **System operacyjny**: [Windows 11, macOS 14, iOS 17]
- **Rozdzielczość**: [1920x1080]
- **User**: [test.user1@example.com]

### Opis
[Jasny i zwięzły opis problemu]

### Kroki do Reprodukcji
1. Przejdź do strony `/generate`
2. Wklej tekst o długości 200 znaków
3. Kliknij "Generuj fiszki"
4. Zaobserwuj błąd

### Oczekiwane Zachowanie
[Co powinno się stać]

### Aktualne Zachowanie
[Co faktycznie się dzieje]

### Screenshoty/Nagrania
[Załącz screenshoty lub nagranie ekranu]

### Logi Konsoli
```
[Wklej błędy z konsoli przeglądarki]
```

### Logi Serwera
```
[Wklej błędy z logów serwera, jeśli dostępne]
```

### Dodatkowe Informacje
- **Frequency**: [Zawsze / Czasami / Rzadko]
- **Impact**: [Liczba dotkniętych użytkowników]
- **Workaround**: [Czy istnieje obejście problemu?]

### Related Issues
[Linki do powiązanych issues]

### Labels
`bug`, `priority:P1`, `component:generation`, `browser:chrome`
```

### 10.3 Workflow Defektu

#### 10.3.1 Stany Defektu
1. **New** (Nowy) - Defekt zgłoszony, oczekuje na weryfikację
2. **Confirmed** (Potwierdzony) - Defekt zweryfikowany przez QA Lead
3. **In Progress** (W trakcie) - Developer pracuje nad naprawą
4. **Fixed** (Naprawiony) - Developer zakończył pracę, oczekuje na weryfikację
5. **Verified** (Zweryfikowany) - QA potwierdził naprawę
6. **Closed** (Zamknięty) - Defekt rozwiązany i wdrożony
7. **Reopened** (Ponownie otwarty) - Defekt nadal występuje po naprawie
8. **Won't Fix** (Nie będzie naprawiony) - Zaakceptowane ryzyko
9. **Duplicate** (Duplikat) - Duplikat innego zgłoszenia

#### 10.3.2 Diagram Workflow

```
New → Confirmed → In Progress → Fixed → Verified → Closed
  ↓        ↓                        ↓        ↓
  ↓        ↓                        ↓        ↓
  ↓        ↓                        ↓        Reopened → In Progress
  ↓        ↓                        ↓
  ↓        Won't Fix → Closed      ↓
  ↓                                 ↓
  Duplicate → Closed               ↓
                                   ↓
                                   Closed
```

### 10.4 Priorytety i SLA

| Priorytet | Czas Reakcji | Czas Naprawy | Eskalacja |
|-----------|--------------|--------------|-----------|
| P0 - Krytyczny | 1 godzina | 24 godziny | Natychmiastowa do CTO |
| P1 - Wysoki | 4 godziny | 3 dni | Po 24h do Team Lead |
| P2 - Średni | 1 dzień | 1 tydzień | Po 3 dniach do Team Lead |
| P3 - Niski | 3 dni | Backlog | Brak |

### 10.5 Komunikacja

#### 10.5.1 Kanały Komunikacji
- **Slack/Discord**: Szybka komunikacja, daily updates
- **GitHub Issues**: Oficjalne zgłoszenia i tracking
- **Email**: Eskalacje i raporty tygodniowe
- **Stand-up Meetings**: Codzienne przeglądy (15 min)

#### 10.5.2 Raporty

##### Raport Dzienny (Daily Test Report)
- Wysyłany: Codziennie o 17:00
- Odbiorcy: Team Lead, Developers
- Zawartość:
  - Liczba wykonanych testów
  - Liczba nowych defektów
  - Liczba naprawionych defektów
  - Blokery

##### Raport Tygodniowy (Weekly Test Summary)
- Wysyłany: Piątek o 16:00
- Odbiorcy: Product Owner, Management
- Zawartość:
  - Postęp testów (% completion)
  - Metryki jakości (defect density, pass rate)
  - Top 5 defektów
  - Ryzyka i problemy
  - Plan na następny tydzień

##### Raport Końcowy (Final Test Report)
- Wysyłany: Po zakończeniu testów
- Odbiorcy: Wszyscy stakeholders
- Zawartość:
  - Executive summary
  - Test coverage
  - Defect summary (total, by priority, by status)
  - Metryki jakości
  - Rekomendacje
  - Lessons learned

### 10.6 Metryki Defektów

#### 10.6.1 Metryki Śledzone
- **Total Defects**: Łączna liczba defektów
- **Open Defects**: Defekty w stanie New/Confirmed/In Progress
- **Defect Density**: Defekty / 1000 linii kodu
- **Defect Leakage**: Defekty znalezione w produkcji
- **Mean Time to Detect (MTTD)**: Średni czas wykrycia defektu
- **Mean Time to Resolve (MTTR)**: Średni czas naprawy defektu
- **Defect Removal Efficiency (DRE)**: % defektów znalezionych przed produkcją

#### 10.6.2 Dashboard Defektów

Przykładowy dashboard (Grafana/Metabase):
- **Wykres słupkowy**: Defekty według priorytetu
- **Wykres kołowy**: Defekty według statusu
- **Wykres liniowy**: Trend defektów w czasie
- **Heatmapa**: Defekty według komponentu i priorytetu
- **Tabela**: Top 10 defektów według wieku

### 10.7 Przykłady Zgłoszeń

#### Przykład 1: Defekt Krytyczny (P0)

```markdown
## 🐛 Bug Report: Użytkownik nie może się zalogować

### Priorytet
- [x] P0 - Krytyczny (Blocker)

### Środowisko
- **URL**: https://aicards.example.com
- **Przeglądarka**: All browsers
- **System operacyjny**: All OS

### Opis
Wszystcy użytkownicy otrzymują błąd "Invalid credentials" nawet przy poprawnych danych logowania. 
Problem rozpoczął się po wdrożeniu v1.2.0 o 14:30.

### Kroki do Reprodukcji
1. Przejdź do `/auth/login`
2. Wprowadź poprawne dane: test@example.com / TestPass123!
3. Kliknij "Zaloguj się"
4. Zaobserwuj błąd

### Oczekiwane Zachowanie
Użytkownik zostaje zalogowany i przekierowany na stronę główną.

### Aktualne Zachowanie
Wyświetlany jest błąd: "Invalid login credentials"

### Logi Serwera
```
[2025-01-25 14:35:12] ERROR: Supabase auth error: Invalid JWT secret
```

### Dodatkowe Informacje
- **Frequency**: Zawsze (100% użytkowników)
- **Impact**: Krytyczny - nikt nie może się zalogować
- **Workaround**: Brak

### Labels
`bug`, `priority:P0`, `component:auth`, `production`
```

#### Przykład 2: Defekt Wysoki (P1)

```markdown
## 🐛 Bug Report: Generowanie fiszek kończy się timeoutem

### Priorytet
- [x] P1 - Wysoki (Critical)

### Środowisko
- **URL**: https://test.aicards.example.com
- **Przeglądarka**: Chrome 120
- **User**: test.user1@example.com

### Opis
Generowanie fiszek z długiego tekstu (5000+ znaków) kończy się timeoutem po 60 sekundach.

### Kroki do Reprodukcji
1. Przejdź do `/generate`
2. Wklej tekst o długości 5000 znaków
3. Kliknij "Generuj fiszki"
4. Czekaj 60 sekund

### Oczekiwane Zachowanie
Fiszki są generowane w ciągu 10-30 sekund.

### Aktualne Zachowanie
Po 60 sekundach wyświetlany jest błąd: "Request timeout"

### Logi Konsoli
```
Error: AbortError: The operation was aborted
```

### Dodatkowe Informacje
- **Frequency**: Zawsze dla tekstów > 5000 znaków
- **Impact**: 20% użytkowników (długie teksty)
- **Workaround**: Użyj krótszego tekstu (< 3000 znaków)

### Labels
`bug`, `priority:P1`, `component:generation`, `performance`
```

---

## 11. Zarządzanie Ryzykiem Testowym

### 11.1 Identyfikacja Ryzyk

| ID | Ryzyko | Prawdopodobieństwo | Wpływ | Priorytet | Mitygacja |
|----|--------|-------------------|-------|-----------|-----------|
| R1 | OpenRouter API niedostępne podczas testów | Średnie | Wysoki | P1 | Użycie mock data, backup API provider |
| R2 | Brak dostępu do środowiska testowego | Niskie | Krytyczny | P0 | Backup environment, lokalne testy |
| R3 | Flaky E2E tests | Wysokie | Średni | P1 | Retry logic, stabilizacja selektorów |
| R4 | Przekroczenie budżetu OpenRouter API | Średnie | Średni | P2 | Limity API calls, cache responses |
| R5 | Brak czasu na pełne testy regresji | Średnie | Wysoki | P1 | Priorytetyzacja testów, automatyzacja |
| R6 | Defekty w bibliotekach zewnętrznych (Supabase, React) | Niskie | Wysoki | P2 | Monitoring release notes, quick updates |
| R7 | Problemy z wydajnością bazy danych | Niskie | Wysoki | P2 | Indeksy, query optimization, monitoring |
| R8 | Naruszenie bezpieczeństwa (data leak) | Bardzo niskie | Krytyczny | P0 | Security audits, RLS verification, penetration testing |
| R9 | Testowanie niezaimplementowanych funkcji (Accept all) | Wysokie | Niski | P3 | Jasna dokumentacja zakresu MVP, skip tests dla niezaimplementowanych funkcji |

### 11.2 Plan Mitygacji Ryzyk

#### R1: OpenRouter API niedostępne
**Mitygacja**:
- Implementacja mock service dla testów
- Backup API provider (OpenAI direct)
- Monitoring uptime OpenRouter
- Alerting przy downtime

**Contingency Plan**:
- Przełączenie na mock data
- Postpone testów wymagających real API
- Komunikacja z OpenRouter support

#### R3: Flaky E2E Tests
**Mitygacja**:
- Użycie stabilnych selektorów (data-testid)
- Explicit waits zamiast implicit
- Retry logic dla niestabilnych testów
- Izolacja testów (cleanup między testami)

**Monitoring**:
- Tracking flakiness rate
- Automatyczne re-run failed tests (max 3x)
- Weekly review flaky tests

#### R5: Brak czasu na pełne testy regresji
**Mitygacja**:
- Priorytetyzacja: Smoke tests → Critical paths → Full regression
- Automatyzacja 70%+ testów
- Parallel execution (GitHub Actions matrix)
- Risk-based testing approach

**Contingency Plan**:
- Skrócony zestaw testów (critical only)
- Extended monitoring po wdrożeniu
- Hotfix readiness

### 11.3 Monitoring Ryzyk

**Częstotliwość**: Tygodniowo podczas retrospektywy

**Odpowiedzialny**: QA Lead

**Akcje**:
- Przegląd listy ryzyk
- Aktualizacja prawdopodobieństwa i wpływu
- Weryfikacja skuteczności mitygacji
- Dodanie nowych ryzyk

---

## 12. Podsumowanie i Wnioski

### 12.1 Kluczowe Elementy Planu

Ten plan testów definiuje kompleksowe podejście do zapewnienia jakości aplikacji AI Cards, obejmując:

1. **Wielowarstwowe testowanie**: Od testów jednostkowych po E2E
2. **Automatyzacja**: 70%+ testów zautomatyzowanych dla efektywności
3. **Bezpieczeństwo**: Szczególny nacisk na RLS i ochronę danych użytkowników
4. **Wydajność**: Monitoring i testy obciążeniowe dla skalowalności
5. **Dostępność**: Zgodność z WCAG 2.1 Level AA
6. **CI/CD Integration**: Automatyczne testy przy każdym PR

### 12.2 Oczekiwane Rezultaty

Po zrealizowaniu planu testów oczekujemy:

- **Jakość**: Aplikacja spełnia wszystkie wymagania funkcjonalne i niefunkcjonalne
- **Stabilność**: < 5 defektów P0/P1 w produkcji w ciągu pierwszych 3 miesięcy
- **Wydajność**: Response time < 2s (p95), LCP < 2.5s
- **Bezpieczeństwo**: 0 krytycznych podatności, pełna izolacja danych użytkowników
- **Zadowolenie użytkowników**: NPS > 50, < 5% bug reports

### 12.3 Ciągłe Doskonalenie

Plan testów jest dokumentem żywym i będzie aktualizowany na podstawie:

- **Feedback z produkcji**: Analiza defektów w produkcji
- **Retrospektywy**: Lessons learned po każdym sprincie
- **Nowe wymagania**: Rozszerzenie zakresu testów o nowe funkcjonalności
- **Nowe narzędzia**: Adopcja lepszych narzędzi testowych
- **Metryki**: Data-driven improvements

### 12.4 Kontakt

W przypadku pytań dotyczących planu testów:

- **QA Lead**: [email@example.com]
- **Product Owner**: [email@example.com]
- **Slack Channel**: #ai-cards-qa

---

## 13. Checklista dla Testerów - Aktualna Wersja MVP

### ✅ **CO TESTOWAĆ** (Zaimplementowane w MVP)

- ✅ Rejestracja i logowanie użytkowników
- ✅ Generowanie fiszek z AI (pojedyncze akceptowanie)
- ✅ Edycja kandydatów przed akceptacją
- ✅ Odrzucanie kandydatów
- ✅ Ręczne tworzenie fiszek
- ✅ Edycja istniejących fiszek
- ✅ Usuwanie fiszek
- ✅ Paginacja listy fiszek
- ✅ Tryb nauki (nawigacja między fiszkami)
- ✅ Przyciski "Don't Know" i "Know" (tylko nawigacja)
- ✅ Row Level Security (RLS)
- ✅ Walidacja limitów znaków (100-10000 dla generowania, 200/500 dla fiszek)

### ⏭️ **CO POMINĄĆ** (Niezaimplementowane w MVP)

- ⏭️ Masowa akceptacja fiszek ("Accept all") - przycisk istnieje, ale funkcjonalność nie działa
- ⏭️ Zapisywanie ocen "Don't Know" / "Know" w bazie danych
- ⏭️ Algorytm spaced repetition
- ⏭️ Import z plików PDF/DOCX
- ⏭️ Funkcje społecznościowe

### 🔧 **OPCJONALNE** (Zależnie od konfiguracji środowiska)

- 🔧 Email verification (TC-AUTH-007) - tylko jeśli włączona w Supabase
- 🔧 Test email service integration - tylko dla środowisk produkcyjnych

### 📝 **KLUCZOWE UWAGI**

1. **Tryb nauki**: Przyciski "Don't Know" i "Know" **NIE zapisują ocen** - służą tylko do przejścia do następnej fiszki
2. **Masowa akceptacja**: Przycisk "Accept all" **nie działa** - należy akceptować fiszki pojedynczo
3. **Email verification**: W środowisku testowym można **wyłączyć** dla szybszych testów
4. **Środowisko testowe**: Upewnij się, że używasz dedykowanego projektu Supabase dla testów

### 🎯 **Priorytety Testowe dla MVP**

**P0 - Krytyczne** (muszą działać):
- Rejestracja i logowanie
- Generowanie fiszek z AI
- Akceptowanie pojedynczych fiszek
- Ręczne tworzenie fiszek
- Tryb nauki (podstawowa nawigacja)
- RLS (izolacja danych użytkowników)

**P1 - Wysokie** (ważne dla UX):
- Edycja fiszek
- Usuwanie fiszek
- Walidacja formularzy
- Obsługa błędów API

**P2 - Średnie** (nice to have):
- Paginacja
- Wydajność
- Dostępność
- Cross-browser compatibility

---

**Wersja dokumentu**: 1.1  
**Data utworzenia**: 2025-01-25  
**Ostatnia aktualizacja**: 2025-01-25  
**Autor**: QA Team  
**Status**: Zatwierdzony do realizacji - zaktualizowany o stan MVP  
**Changelog**:
- v1.1 (2025-01-25): Dodano uwagi o aktualnym stanie MVP (tryb nauki, masowa akceptacja, email verification)
- v1.0 (2025-01-25): Wersja początkowa

