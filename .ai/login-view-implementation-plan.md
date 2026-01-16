# Plan implementacji widoku Logowania

## 1. Przegląd
Widok logowania (`Login`) jest stroną, która umożliwi uwierzytelnienie użytkownika w aplikacji. W obecnej fazie MVP (Minimum Viable Product) będzie to strona tymczasowa (placeholder), której głównym celem jest ustanowienie przepływu użytkownika i routingu. Będzie ona zawierać formularz logowania, który w tej iteracji będzie korzystał z mockowanej (udawanej) logiki. Po pomyślnym "zalogowaniu", użytkownik zostanie przekierowany do głównego widoku aplikacji. Widok ten będzie również zawierał link do strony rejestracji.

## 2. Routing widoku
Widok będzie dostępny pod następującą ścieżką:
- `/auth/login`

## 3. Struktura komponentów
Struktura widoku będzie prosta i skupiona na jednym głównym komponencie interaktywnym.

```
/src/pages/auth/login.astro
└── /src/layouts/Layout.astro
    └── /src/components/forms/LoginForm.tsx
        ├── Card (Shadcn/ui)
        │   ├── CardHeader, CardTitle, CardDescription
        │   ├── CardContent
        │   │   ├── Form (Shadcn/ui)
        │   │   │   ├── Input (dla e-maila)
        │   │   │   ├── Input (dla hasła)
        │   │   │   └── Button (do wysłania formularza)
        │   └── CardFooter
        │       └── Link do strony /register
        └── Toaster (Shadcn/ui - opcjonalnie dla powiadomień)
```

## 4. Szczegóły komponentu

### `login.astro` (Strona)
- **Opis komponentu:** Jest to plik strony Astro, który definiuje trasę `/auth/login`. Jego zadaniem jest osadzenie ogólnego layoutu aplikacji (`Layout.astro`) i renderowanie w nim komponentu React `LoginForm`.
- **Główne elementy:**
  - `<Layout>`: Główny wrapper layoutu aplikacji.
  - `<LoginForm client:load />`: Interaktywny komponent React renderowany po stronie klienta.
- **Propsy:** Brak.

### `LoginForm.tsx` (Komponent React)
- **Opis komponentu:** Komponent ten renderuje interaktywny formularz logowania. Zarządza swoim wewnętrznym stanem (wprowadzane dane, stan ładowania, błędy) i obsługuje logikę walidacji oraz wysyłki formularza. Będzie zbudowany przy użyciu biblioteki `react-hook-form` do zarządzania formularzem i `zod` do walidacji schematu.
- **Główne elementy:**
  - Komponent `<form>` opakowany w komponenty z `shadcn/ui` (`Card`, `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`).
  - Pole `<Input>` dla adresu e-mail.
  - Pole `<Input type="password">` dla hasła.
  - Komponent `<Button type="submit">`, który będzie wyświetlał stan ładowania.
  - Link do strony rejestracji (`/register`) w stopce karty.
- **Obsługiwane interakcje:**
  - `onSubmit`: Uruchamiane po kliknięciu przycisku "Zaloguj się".
- **Obsługiwana walidacja:**
  - `email`: Musi być poprawnym adresem e-mail i nie może być pusty.
  - `password`: Nie może być puste.
- **Typy:** `LoginFormViewModel` (zdefiniowany przez `zod`).
- **Propsy:** Brak.

## 5. Typy
Do implementacji tego widoku potrzebny będzie jeden główny typ (model widoku), który zostanie zdefiniowany za pomocą `zod` w celu walidacji.

**`LoginSchema` (zod schema)**
- **Opis:** Definiuje kształt danych formularza logowania oraz reguły ich walidacji.
- **Pola:**
  - `email`: `z.string().email("Proszę podać poprawny adres e-mail.")` - Pole tekstowe, walidowane jako e-mail.
  - `password`: `z.string().min(1, "Hasło jest wymagane.")` - Pole tekstowe, nie może być puste.

**`LoginFormViewModel`**
- **Opis:** Typ inferowany z `LoginSchema`, reprezentujący dane formularza.
- **Definicja:** `type LoginFormViewModel = z.infer<typeof LoginSchema>;`

## 6. Zarządzanie stanem
Stan formularza (wartości pól, błędy walidacji, stan wysyłki) będzie zarządzany lokalnie w komponencie `LoginForm.tsx` przy użyciu hooka `useForm` z biblioteki `react-hook-form`.

- **`form`**: Obiekt zwrócony przez `useForm`, zawierający metody do rejestracji pól, obsługi wysyłki, dostępu do stanu formularza (`formState.isSubmitting`) i błędów.
- Nie ma potrzeby tworzenia niestandardowego hooka dla tego komponentu.

## 7. Integracja API
Integracja z API w tej fazie będzie **mockowana**. Nie zostanie wykonane żadne rzeczywiste żądanie HTTP.

- **Typ żądania:** Odpowiada `LoginFormViewModel`: `{ email: string, password: string }`.
- **Typ odpowiedzi:** Brak (w przypadku sukcesu nastąpi przekierowanie).
- **Logika:**
  1. Funkcja `onSubmit` w `LoginForm.tsx` otrzyma dane z formularza.
  2. Funkcja zasymuluje opóźnienie sieciowe (np. 1 sekunda).
  3. Nastąpi sprawdzenie, czy dane logowania pasują do zakodowanych na stałe wartości (np. `email: 'test@example.com'`, `password: 'password'`).
  4. **W przypadku sukcesu:** Użytkownik zostanie przekierowany na stronę `/generate` za pomocą `window.location.href = '/generate'`.
  5. **W przypadku porażki:** Błąd zostanie ustawiony w stanie formularza za pomocą `form.setError`, co wyświetli komunikat w interfejsie użytkownika.

## 8. Interakcje użytkownika
- **Wpisywanie danych:** Użytkownik wpisuje swój e-mail i hasło w odpowiednie pola. Walidacja odbywa się na bieżąco (np. po utracie fokusu) lub podczas próby wysłania formularza.
- **Wysyłanie formularza:** Użytkownik klika przycisk "Zaloguj się". Przycisk staje się nieaktywny, a w jego miejsce może pojawić się ikona ładowania.
- **Nawigacja do rejestracji:** Użytkownik może kliknąć link "Zarejestruj się", co przeniesie go na stronę `/register`.

## 9. Warunki i walidacja
Walidacja będzie realizowana po stronie klienta w komponencie `LoginForm.tsx` z użyciem `zod` i `react-hook-form`.
- **Warunek 1: Poprawność adresu e-mail.** Pole e-mail musi zawierać prawidłowy format adresu. Jeśli warunek nie jest spełniony, pod polem pojawi się komunikat błędu "Proszę podać poprawny adres e-mail.".
- **Warunek 2: Obecność hasła.** Pole hasła nie może być puste. W przeciwnym razie pojawi się komunikat "Hasło jest wymagane.".
- Stan przycisku "Zaloguj się" będzie zależny od stanu `isSubmitting` z `useForm`, aby zapobiec wielokrotnemu wysyłaniu formularza.

## 10. Obsługa błędów
- **Błędy walidacji:** Obsługiwane automatycznie przez `react-hook-form` i `zod`. Komunikaty o błędach będą wyświetlane pod odpowiednimi polami formularza.
- **Błąd "logowania" (mock):** Jeśli użytkownik poda dane inne niż te zakodowane na stałe, funkcja `onSubmit` użyje `form.setError("root", { message: "Nieprawidłowy e-mail lub hasło." })`. Ten błąd będzie wyświetlany w widocznym miejscu, np. nad przyciskiem wysyłania.
- Ewentualne nieprzewidziane błędy (w przyszłości np. błędy sieciowe) mogą być komunikowane za pomocą komponentu `Sonner` (toast).

## 11. Kroki implementacji
1. **Utworzenie pliku strony:** Stwórz plik `src/pages/auth/login.astro`.
2. **Dodanie routingu i layoutu:** W pliku `login.astro` zaimportuj i użyj komponentu `Layout` oraz `LoginForm`. Ustaw atrybut `client:load` dla komponentu `LoginForm`.
3. **Utworzenie pliku komponentu:** Stwórz plik `src/components/forms/LoginForm.tsx`.
4. **Zdefiniowanie schematu walidacji:** W `LoginForm.tsx` zdefiniuj `LoginSchema` przy użyciu biblioteki `zod`.
5. **Budowa UI formularza:** Zbuduj interfejs formularza, używając komponentów z `shadcn/ui` (`Card`, `Form`, `Input`, `Button` itd.) oraz `react-hook-form` do połączenia pól ze stanem.
6. **Implementacja stanu:** Zainicjuj hook `useForm` z resolverem `zodResolver(LoginSchema)`.
7. **Implementacja logiki wysyłania:** Stwórz asynchroniczną funkcję `onSubmit`, która będzie obsługiwać mockowaną logikę logowania, w tym symulację opóźnienia, sprawdzanie danych, przekierowanie w przypadku sukcesu i ustawianie błędu w przypadku porażki.
8. **Dodanie linku do rejestracji:** W stopce komponentu `Card` dodaj link (`<a>`) prowadzący do strony `/register`.
9. **Stylizowanie:** Upewnij się, że komponent jest wyśrodkowany na stronie i spójny wizualnie z resztą aplikacji, używając klas Tailwind CSS.
