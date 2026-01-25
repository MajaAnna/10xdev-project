# Specyfikacja Techniczna: Moduł Autentykacji Użytkownika

## 1. Podsumowanie i Główne Założenia

Celem jest implementacja kompletnego systemu uwierzytelniania użytkowników (rejestracja, logowanie, wylogowywanie, odzyskiwanie hasła) w aplikacji AI Cards, zgodnie z wymaganiami PRD i istniejącym stosem technologicznym (Astro, React, Supabase).

Architektura opiera się na trybie **SSR (Server-Side Rendering)** Astro, co pozwala na centralne zarządzanie sesją i ochronę tras na poziomie serwera. Klient Supabase będzie używany zarówno na serwerze (w middleware i endpointach API Astro), jak i na kliencie (wewnątrz komponentów React), zgodnie z najlepszymi praktykami.

**Kluczowe założenia:**

- **Ochrona Tras:** Wszystkie strony aplikacji, z wyjątkiem `/auth/*`, będą niedostępne dla niezalogowanych użytkowników.
- **Separacja Odpowiedzialności:**
  - **Astro (`.astro`):** Pełni rolę "backendu dla frontendu" (BFF). Renderuje strony na serwerze, dostarcza dane do komponentów i obsługuje logikę biznesową w endpointach API.
  - **React (`.tsx`):** Służy do budowy interaktywnych komponentów UI (formularze, nawigacja), które komunikują się z endpointami API Astro, a nie bezpośrednio z Supabase (z wyjątkiem specyficznych operacji po stronie klienta).
- **Zarządzanie Sesją:** Sesja będzie zarządzana za pomocą ciasteczek (`cookies`) obsługiwanych przez Supabase Auth SDK. Middleware Astro będzie odczytywać i weryfikować te ciasteczka przy każdym żądaniu.

---

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Nowe i Zmodyfikowane Strony (`/src/pages`)

#### Nowe Strony (tylko dla niezalogowanych):

- **`/src/pages/auth/login.astro`**: Zastąpi istniejącą stronę logowania. Będzie renderować komponent `<LoginForm client:load />`. Przekieruje zalogowanych użytkowników do `/`.
- **`/src/pages/auth/register.astro`**: Zastąpi istniejącą stronę rejestracji. Będzie renderować `<RegisterForm client:load />`. Przekieruje zalogowanych użytkowników do `/`.
- **`/src/pages/auth/password-recovery.astro`**: Nowa strona do obsługi procesu odzyskiwania hasła. Będzie renderować komponent `<PasswordRecoveryForm client:load />`.
- **`/src/pages/auth/callback.astro`**: Endpoint po stronie serwera do obsługi callbacków od Supabase (np. po potwierdzeniu e-maila). Wymienni sesję i przekierowuje użytkownika.

#### Modyfikacja Istniejących Stron:

Wszystkie istniejące strony (`/cards.astro`, `/generate.astro`, itd.) nie wymagają bezpośrednich zmian. Ich ochrona zostanie zrealizowana przez middleware i modyfikację głównego layoutu.

### 2.2. Nowe i Zmodyfikowane Komponenty React (`/src/components`)

#### Formularze (komponenty klienckie):

- **`LoginForm.tsx`**:
  - Zarządza stanem pól `email` i `password`.
  - Waliduje dane wejściowe po stronie klienta (np. przy użyciu `zod`) w celu szybkiego feedbacku.
  - Po przesłaniu, wysyła żądanie `POST` do endpointu `/api/auth/login`.
  - Obsługuje stany `loading`, `error` i `success`, wyświetlając odpowiednie komunikaty (np. "Nieprawidłowy email lub hasło").
- **`RegisterForm.tsx`**:
  - Podobnie jak `LoginForm`, zarządza stanem i walidacją dla `email`, `password` i `confirmPassword`.
  - Wysyła żądanie `POST` do `/api/auth/register`.
- **`PasswordRecoveryForm.tsx` (nowy)**:
  - Formularz z jednym polem `email`.
  - Wysyła żądanie `POST` do `/api/auth/password-recovery`.
  - Wyświetla komunikat o wysłaniu linku do resetu hasła.

#### Komponenty UI:

- **`TopNav.tsx`**:
  - Musi zostać zmodyfikowany, aby przyjmować informację o zalogowanym użytkowniku jako `prop` (`user`).
  - **Tryb `non-auth` (`user` jest `null`):** Wyświetla linki "Zaloguj się" i "Zarejestruj się".
  - **Tryb `auth` (`user` istnieje):** Ukrywa powyższe linki, wyświetla awatar/email użytkownika oraz przycisk/komponent `<SignOutButton />`.
- **`SignOutButton.tsx`**:
  - Przycisk, który po kliknięciu wysyła żądanie `POST` do `/api/auth/logout`.
  - Po pomyślnym wylogowaniu, przekierowuje użytkownika na stronę logowania (`/auth/login`).

### 2.3. Layout (`/src/layouts`)

- **`Layout.astro`**:
  - W sekcji frontmatter (`---`) będzie pobierać dane użytkownika z `Astro.locals.user` (dostarczone przez middleware).
  - Przekazuje obiekt `user` (lub `null`) jako `prop` do komponentu `<TopNav />`.
  - To centralny punkt, który sprawia, że UI staje się "świadome" stanu zalogowania przy każdym renderowaniu strony na serwerze.

---

## 3. Backend (Astro API & Middleware)

### 3.1. Middleware (`/src/middleware/index.ts`)

To kluczowy element całej architektury, który będzie wykonywany przed każdym żądaniem.

**Logika działania:**

1. Pobierz `accessToken` i `refreshToken` z `Astro.cookies`.
2. Jeśli ciasteczka istnieją, użyj serwerowego klienta Supabase, aby zweryfikować sesję (`supabase.auth.getUser(accessToken)`).
3. **Jeśli sesja jest ważna:**
   - Zapisz dane użytkownika w `Astro.locals.user`.
   - Jeśli użytkownik próbuje wejść na stronę w `/auth/`, przekieruj go do strony głównej (`/`).
   - W przeciwnym razie, kontynuuj (`return next()`).
4. **Jeśli sesja jest nieważna (lub ciasteczka nie istnieją):**
   - Wyczyść ewentualne pozostałości w `Astro.locals`.
   - Jeśli żądanie dotyczy chronionej strony (czyli każdej poza `/auth/*`, `/api/auth/*`), zwróć odpowiedź `Astro.redirect('/auth/login')`.
   - Jeśli żądanie dotyczy publicznej strony lub API autentykacji, kontynuuj (`return next()`).

### 3.2. Endpointy API (`/src/pages/api/auth`)

Te endpointy będą jedynym punktem kontaktu dla formularzy React. Będą one opakowywać logikę Supabase Auth.

- **`login.ts` (`POST`)**:
  1. Pobiera `email` i `password` z ciała żądania.
  2. Waliduje dane wejściowe serwerowo (używając `zod`).
  3. Wywołuje `supabase.auth.signInWithPassword({ email, password })`.
  4. Jeśli logowanie się powiedzie, Supabase SDK automatycznie zarządza ustawieniem ciasteczek. Endpoint zwraca `200 OK`.
  5. W przypadku błędu (np. złe hasło), zwraca `401 Unauthorized` z komunikatem błędu w JSON.
- **`register.ts` (`POST`)**:
  1. Działa analogicznie do logowania, ale wywołuje `supabase.auth.signUp()`.
  2. Supabase może wymagać potwierdzenia adresu e-mail – endpoint powinien zwrócić odpowiednią informację.
- **`logout.ts` (`POST`)**:
  1. Wywołuje `supabase.auth.signOut()`.
  2. Supabase SDK zarządza usunięciem ciasteczek.
  3. Zwraca `200 OK`, co po stronie klienta inicjuje przekierowanie.
- **`password-recovery.ts` (`POST`)**:
  1. Pobiera `email`.
  2. Wywołuje `supabase.auth.resetPasswordForEmail()`.
  3. Zawsze zwraca `200 OK`, aby nie ujawniać, czy dany email istnieje w bazie.

---

## 4. System Autentykacji i Integracja z Supabase

### 4.1. Konfiguracja Klientów Supabase

Należy utworzyć dwa oddzielne klienty Supabase:

- **Klient Serwerowy (`/src/db/supabase.server.ts`):**
  - Inicjalizowany przy użyciu `createClient` z `supabase-js`.
  - Używa zmiennych środowiskowych `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY`.
  - **Nigdy nie powinien być importowany po stronie klienta.** Używany wyłącznie w middleware i endpointach API Astro.
- **Klient Kliencki (`/src/db/supabase.client.ts`):**
  - Używa `createBrowserClient`.
  - Korzysta z publicznie dostępnych kluczy `SUPABASE_URL` i `SUPABASE_ANON_KEY`.
  - Może być bezpiecznie używany w komponentach React.

### 4.2. Zmienne Środowiskowe (`.env`)

Plik `.env` musi zawierać:

```
PUBLIC_SUPABASE_URL="twoj-url"
PUBLIC_SUPABASE_ANON_KEY="twoj-klucz-anon"
SUPABASE_SERVICE_ROLE_KEY="twoj-klucz-serwisowy"
```

Astro automatycznie udostępni zmienne z prefiksem `PUBLIC_` do kodu klienckiego.

### 4.3. Walidacja i Obsługa Błędów

- **Walidacja po stronie klienta (React):** Biblioteka `zod` zostanie użyta w formularzach do natychmiastowego feedbacku dla użytkownika (np. "Hasło musi mieć co najmniej 8 znaków").
- **Walidacja po stronie serwera (Astro API):** Każdy endpoint API **musi** ponownie walidować te same dane przy użyciu `zod` przed przekazaniem ich do Supabase. Jest to krytyczne dla bezpieczeństwa.
- **Komunikaty o błędach:** Endpointy API powinny "tłumaczyć" surowe błędy z Supabase na proste, zrozumiałe dla użytkownika komunikaty i zwracać je w ustrukturyzowanym formacie JSON, np. `{ "error": "Użytkownik o tym adresie email już istnieje." }`.
