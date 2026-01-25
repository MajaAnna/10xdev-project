# Plan implementacji widoku Rejestracji

## 1. Przegląd

Celem tego widoku jest umożliwienie nowym użytkownikom tworzenia konta w aplikacji. Zgodnie z wymaganiami MVP, będzie to strona z formularzem rejestracyjnym, który po pomyślnym przesłaniu utworzy nowego użytkownika za pomocą systemu uwierzytelniania Supabase i automatycznie go zaloguje. Widok będzie również zawierał link do strony logowania dla użytkowników, którzy już posiadają konto.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:

- **Ścieżka:** `/register`

## 3. Struktura komponentów

Struktura będzie opierać się na stronie Astro, która renderuje pojedynczy interaktywny komponent React.

```
/src/pages/register.astro
└── /src/layouts/Layout.astro
    └── /src/components/forms/RegisterForm.tsx (client:load)
        ├── Card (Shadcn)
        │   ├── CardHeader (z tytułem i opisem)
        │   ├── CardContent
        │   │   ├── Form
        │   │   │   ├── Input (Email) z Label
        │   │   │   ├── Input (Password) z Label
        │   │   │   ├── Input (Confirm Password) z Label
        │   │   │   └── [Miejsce na komunikat o błędzie API]
        │   └── CardFooter
        │       ├── Button (Submit)
        │       └── Link do strony logowania
        └── Spinner (wyświetlany podczas ładowania)
```

## 4. Szczegóły komponentów

### `/src/pages/register.astro`

- **Opis komponentu:** Główny plik strony dla ścieżki `/register`. Jego zadaniem jest renderowanie głównego layoutu aplikacji oraz osadzenie interaktywnego komponentu formularza `RegisterForm.tsx`.
- **Główne elementy:**
  - `<Layout>`: Główny layout aplikacji.
  - `<RegisterForm client:load />`: Komponent React renderowany po stronie klienta.

### `/src/components/forms/RegisterForm.tsx`

- **Opis komponentu:** Interaktywny komponent React, który renderuje interfejs formularza rejestracji. Zarządza stanem pól formularza, walidacją po stronie klienta oraz komunikacją z API Supabase w celu utworzenia konta użytkownika.
- **Główne elementy:**
  - `<form>`: Główny element formularza.
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` (z Shadcn/ui) do strukturyzacji formularza.
  - `Input` i `Label` (z Shadcn/ui) dla pól: `email`, `password`, `confirmPassword`.
  - `Button` (z Shadcn/ui) do wysłania formularza.
  - Element `<a>` w stopce karty, kierujący do `/login`.
  - `Spinner` (z Shadcn/ui) wyświetlany wewnątrz przycisku podczas operacji asynchronicznej.
- **Obsługiwane interakcje:**
  - `onChange` na polach `Input` do aktualizacji stanu formularza.
  - `onSubmit` na elemencie `<form>` do uruchomienia logiki walidacji i rejestracji.
- **Warunki walidacji (szczegółowe):**
  - `email`: Musi być prawidłowym formatem adresu e-mail (np. `user@example.com`). Nie może być pusty.
  - `password`: Nie może być pusty. Musi mieć co najmniej 8 znaków.
  - `confirmPassword`: Musi być identyczne z polem `password`. Nie może być puste.
- **Typy:** `RegisterFormViewModel`, `RegisterRequestDto`.
- **Propsy:** Komponent nie przyjmuje żadnych propsów.

## 5. Typy

Do implementacji widoku potrzebne będą następujące typy, zdefiniowane w pliku `RegisterForm.tsx` lub w dedykowanym pliku typów formularzy.

- **`RegisterFormViewModel`**: Obiekt przechowujący dane formularza w stanie komponentu.
  ```typescript
  interface RegisterFormViewModel {
    email: string;
    password: string;
    confirmPassword: string;
  }
  ```
- **`RegisterRequestDto`**: Obiekt danych wysyłany do metody `signUp` klienta Supabase. Struktura jest zdefiniowana przez Supabase.

  ```typescript
  import type { SignUpWithPasswordCredentials } from "@supabase/supabase-js";

  // To jest typ, którego oczekuje metoda signUp
  type RegisterRequestDto = SignUpWithPasswordCredentials;
  // {
  //   email: string;
  //   password: string;
  //   options?: {
  //     emailRedirectTo?: string;
  //     data?: object;
  //   }
  // }
  ```

## 6. Zarządzanie stanem

Stan będzie zarządzany lokalnie w komponencie `RegisterForm.tsx` przy użyciu hooka `useState`. Nie ma potrzeby tworzenia customowego hooka ani używania globalnego zarządcy stanu dla tego widoku.

- `const [formData, setFormData] = useState<RegisterFormViewModel>({ email: '', password: '', confirmPassword: '' });`
  - Cel: Przechowywanie wartości wprowadzanych przez użytkownika w polach formularza.
- `const [errors, setErrors] = useState<ZodError | null>(null);`
  - Cel: Przechowywanie błędów walidacji z biblioteki Zod, aby wyświetlić je w interfejsie.
- `const [isLoading, setIsLoading] = useState<boolean>(false);`
  - Cel: Śledzenie stanu operacji asynchronicznej (rejestracji). Służy do wyświetlania wskaźnika ładowania i blokowania przycisku.
- `const [apiError, setApiError] = useState<string | null>(null);`
  - Cel: Przechowywanie i wyświetlanie błędów zwróconych przez API Supabase (np. "Użytkownik już istnieje").

## 7. Integracja API

Integracja będzie polegać na wywołaniu metody `signUp` z klienta Supabase.

- **Endpoint:** `supabaseClient.auth.signUp(credentials)`
- **Typ żądania (credentials):** `RegisterRequestDto` (zawierający `email` i `password`).
- **Typ odpowiedzi (sukces):** `{ data: { user, session }, error: null }`. Po pomyślnej rejestracji, klient Supabase automatycznie zarządza sesją (ustawia cookie).
- **Typ odpowiedzi (błąd):** `{ data: { user: null, session: null }, error: AuthError }`. Błąd będzie przechwytywany w bloku `catch`.

**Przykład wywołania:**

```typescript
const { data, error } = await supabaseClient.auth.signUp({
  email: formData.email,
  password: formData.password,
});

if (error) {
  // obsługa błędu
} else {
  // obsługa sukcesu (np. przekierowanie)
}
```

Należy upewnić się, że zmienne środowiskowe `SUPABASE_URL` i `SUPABASE_KEY` są w pliku `.env` poprzedzone prefiksem `PUBLIC_`, aby były dostępne po stronie klienta w Astro (`import.meta.env.PUBLIC_SUPABASE_URL`).

## 8. Interakcje użytkownika

- **Wprowadzanie danych:** Użytkownik wpisuje dane w pola formularza. Każda zmiana aktualizuje stan `formData`.
- **Przesłanie formularza:**
  - Użytkownik klika przycisk "Zarejestruj się".
  - Uruchamiana jest walidacja.
  - Jeśli walidacja nie powiedzie się, błędy są wyświetlane pod odpowiednimi polami.
  - Jeśli walidacja powiedzie się, przycisk jest blokowany, wyświetlany jest `Spinner`, a do Supabase wysyłane jest żądanie rejestracji.
- **Sukces rejestracji:** Użytkownik jest przekierowywany na stronę główną (`/`) jako zalogowany.
- **Błąd rejestracji:** Komunikat o błędzie jest wyświetlany w obszarze formularza. Przycisk jest ponownie aktywowany.
- **Nawigacja do logowania:** Użytkownik klika link "Masz już konto? Zaloguj się", co przenosi go na stronę `/login`.

## 9. Warunki i walidacja

Walidacja będzie przeprowadzana po stronie klienta przy użyciu biblioteki Zod.

- **Schemat walidacji (Zod):**
  ```typescript
  const registerSchema = z
    .object({
      email: z.string().email({ message: "Nieprawidłowy adres email." }),
      password: z.string().min(8, { message: "Hasło musi mieć co najmniej 8 znaków." }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Hasła muszą być takie same.",
      path: ["confirmPassword"], // Błąd przypisany do pola confirmPassword
    });
  ```
- **Proces walidacji:** W handlerze `onSubmit`, dane z `formData` będą parsowane przez `registerSchema.safeParse()`. W przypadku błędu, obiekt `errors` w stanie zostanie zaktualizowany, co spowoduje wyświetlenie komunikatów w UI.

## 10. Obsługa błędów

- **Błędy walidacji:** Wyświetlane bezpośrednio pod polami formularza, których dotyczą. Stan `errors` będzie źródłem tych komunikatów.
- **Błędy API (z `supabaseClient.auth.signUp`):**
  - **`User already registered`**: Wyświetlany będzie komunikat: "Konto z tym adresem email już istnieje."
  - **`Password should be at least X characters`**: Wyświetlany będzie komunikat zgodny z polityką haseł Supabase.
  - **Inne błędy (np. sieciowe):** Wyświetlany będzie ogólny komunikat: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."
- Wszystkie błędy API będą aktualizować stan `apiError`, który będzie renderowany w przeznaczonym do tego miejscu w komponencie.

## 11. Kroki implementacji

1. Utworzyć plik strony `/src/pages/register.astro`. Wewnątrz umieścić komponent `<Layout>` i `<RegisterForm client:load />`.
2. Stworzyć plik komponentu `/src/components/forms/RegisterForm.tsx`.
3. Zbudować strukturę UI komponentu `RegisterForm` przy użyciu komponentów z `Shadcn/ui` (`Card`, `Input`, `Button`, `Label`).
4. Dodać `Spinner` do `Button` i kontrolować jego widoczność za pomocą stanu `isLoading`.
5. Zaimplementować lokalne zarządzanie stanem dla `formData`, `errors`, `isLoading` i `apiError` przy użyciu hooka `useState`.
6. Zdefiniować schemat walidacji Zod (`registerSchema`) zgodnie z opisanymi wymaganiami.
7. Zaimplementować handler `onSubmit`, który:
   a. Zapobiega domyślnej akcji formularza.
   b. Waliduje dane za pomocą schematu Zod.
   c. W przypadku błędów walidacji, aktualizuje stan `errors`.
   d. W przypadku sukcesu walidacji, ustawia `isLoading` na `true` i wywołuje `supabaseClient.auth.signUp`.
8. W bloku `try...catch` obsłużyć odpowiedź z Supabase:
   a. W przypadku sukcesu (brak `error`), przekierować użytkownika na stronę główną (`window.location.href = '/'`).
   b. W przypadku błędu (`error`), zaktualizować stan `apiError` i ustawić `isLoading` na `false`.
9. Dodać link nawigacyjny do `/login` w stopce karty formularza.
10. Sprawdzić, czy zmienne środowiskowe Supabase są poprawnie skonfigurowane w pliku `.env` z prefiksem `PUBLIC_`.
11. Ostylować komponenty, aby zapewnić responsywność i spójność wizualną z resztą aplikacji.
