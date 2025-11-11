# Dokument wymagań produktu (PRD) - Fiszki AI

## 1. Przegląd produktu

Celem projektu jest stworzenie aplikacji internetowej w modelu MVP (Minimum Viable Product), która rozwiązuje problem czasochłonnego, ręcznego tworzenia fiszek edukacyjnych. Kluczową funkcjonalnością aplikacji jest generator fiszek oparty na sztucznej inteligencji (AI), który automatycznie tworzy propozycje fiszek na podstawie tekstu wklejonego przez użytkownika.

Aplikacja umożliwi również manualne tworzenie i edycję fiszek, a także zaoferuje system recenzji propozycji od AI, dając użytkownikowi pełną kontrolę nad jakością materiałów. Wszystkie zapisane fiszki będą przechowywane na koncie użytkownika i dostępne w ramach prostego trybu nauki, który w przyszłości zostanie zintegrowany z gotowym algorytmem powtórek (spaced repetition) typu open-source.

## 2. Problem użytkownika

Głównym problemem, który rozwiązuje aplikacja, jest fakt, że manualne tworzenie wysokiej jakości fiszek jest procesem żmudnym i czasochłonnym. To zniechęca wiele osób, w tym uczniów, studentów i profesjonalistów, do korzystania z jednej z najefektywniejszych metod nauki, jaką są regularne powtórki (spaced repetition). Użytkownicy posiadają już materiały do nauki w formie cyfrowej (notatki, artykuły, fragmenty e-booków) i potrzebują narzędzia, które pozwoli im szybko i bez wysiłku przekształcić te treści w zestawy interaktywnych fiszek.

## 3. Wymagania funkcjonalne

### 3.1. Generator Fiszki z AI
- Użytkownik może wkleić w dedykowane pole tekst o długości od 100 do 10 000 znaków.
- Na podstawie wklejonego tekstu, system generuje listę "kandydatów na fiszki".
- Każdy kandydat składa się z "przodu" (pytanie, termin) o maksymalnej długości 200 znaków i "tyłu" (odpowiedź, definicja) o maksymalnej długości 500 znaków.
- Wygenerowani kandydaci nie są automatycznie zapisywani w bazie danych; wymagają recenzji użytkownika.

### 3.2. System Recenzji Kandydatów
- Po wygenerowaniu, kandydaci na fiszki są prezentowani w formie listy.
- Użytkownik ma możliwość masowej akceptacji wszystkich kandydatów jednym przyciskiem.
- Każdy kandydat na liście może być indywidualnie usunięty (odrzucony).
- Kliknięcie w kandydata otwiera okno modal, w którym użytkownik może go edytować, zaakceptować lub odrzucić.
- Fiszka jest zapisywana w bazie danych dopiero po jawnej akcji użytkownika (akceptacja lub edycja i akceptacja).

### 3.3. Zarządzanie Fiszami
- Użytkownicy mogą tworzyć fiszki ręcznie za pomocą prostego formularza (przód/tył).
- Wszystkie zapisane fiszki (zarówno te stworzone ręcznie, jak i te zaakceptowane od AI) trafiają na jedną, wspólną listę w widoku "Moje fiszki".
- Lista fiszek jest sortowana chronologicznie (od najnowszej do najstarszej).
- Każda zapisana fiszka może być edytowana lub usunięta przez użytkownika.

### 3.4. Tryb Nauki
- Aplikacja oferuje prosty tryb nauki.
- Użytkownikowi prezentowany jest "przód" fiszki.
- Po kliknięciu przycisku "Sprawdź odpowiedź", odsłaniany jest "tył" fiszki.
- Użytkownik ocenia swoją znajomość odpowiedzi za pomocą trzech przycisków: "Nie wiem", "Wiem", "Łatwe". Oceny te będą w przyszłości wykorzystywane przez algorytm powtórek.

### 3.5. System Kont Użytkowników
- Aplikacja będzie posiadać prosty system uwierzytelniania oparty na adresie e-mail i haśle.
- Każdy użytkownik ma dostęp wyłącznie do własnych fiszek.
- Implementacja tej funkcjonalności jest zaplanowana na późniejszy etap projektu.

### 3.6. Wymagania Techniczne i Bezpieczeństwo
- Backend i baza danych zostaną oparte o platformę Supabase.
- Zostaną zaimplementowane standardowe praktyki bezpieczeństwa, w tym uwierzytelnianie, autoryzacja na poziomie wiersza (RLS) oraz walidacja danych wejściowych.

## 4. Granice produktu

Następujące funkcjonalności celowo NIE wchodzą w zakres wersji MVP:
- Implementacja własnego, zaawansowanego algorytmu powtórek (jak np. algorytm SM-2 z SuperMemo lub Anki).
- Import fiszek z plików w różnych formatach (np. PDF, DOCX, CSV).
- Funkcje społecznościowe, takie jak współdzielenie talii (decków) fiszek między użytkownikami.
- Integracje z zewnętrznymi platformami edukacyjnymi (np. Moodle, Google Classroom).
- Dedykowane aplikacje mobilne na systemy iOS i Android (projekt startuje jako aplikacja webowa).
- Zaawansowana organizacja fiszek w talie (decki) lub foldery.

## 5. Historyjki użytkowników

### US-001
- Tytuł: Generowanie kandydatów na fiszki z podanego tekstu
- Opis: Jako użytkownik, chcę wkleić tekst (np. notatki z wykładu) i otrzymać listę propozycji fiszek wygenerowanych przez AI, aby zaoszczędzić czas na ich ręcznym tworzeniu.
- Kryteria akceptacji:
  1. Na stronie głównej znajduje się pole tekstowe do wklejania tekstu.
  2. Pole tekstowe akceptuje tekst o długości od 100 do 10 000 znaków.
  3. Po wklejeniu tekstu i kliknięciu przycisku "Generuj fiszki", system wysyła zapytanie do AI, a interfejs wyświetla wskaźnik ładowania.
  4. Po zakończeniu generowania, użytkownik jest przekierowywany do widoku recenzji z listą kandydatów na fiszki.
  5. Każdy kandydat ma "przód" (do 200 znaków) i "tył" (do 500 znaków).
  6. Kandydaci nie są zapisywani w bazie danych na tym etapie.

### US-002
- Tytuł: Przeglądanie listy kandydatów na fiszki
- Opis: Jako użytkownik, po wygenerowaniu fiszek przez AI, chcę zobaczyć listę kandydatów, aby móc zdecydować, które z nich zapisać.
- Kryteria akceptacji:
  1. Kandydaci są wyświetlani w formie czytelnej listy.
  2. Każdy element listy pokazuje "przód" i "tył" kandydata.
  3. Przy każdym kandydacie znajduje się ikona kosza na śmieci do jego usunięcia z listy.
  4. Kliknięcie w dowolne miejsce na elemencie listy (poza ikoną kosza) otwiera modal edycji.
  5. Nad listą znajduje się przycisk "Zaakceptuj wszystkie".

### US-003
- Tytuł: Odrzucenie (usunięcie) kandydata na fiszkę
- Opis: Jako użytkownik, chcę mieć możliwość usunięcia niechcianego kandydata z listy propozycji, aby nie zaśmiecał mojej kolekcji.
- Kryteria akceptacji:
  1. Kliknięcie ikony kosza na śmieci przy kandydacie powoduje jego natychmiastowe usunięcie z listy.
  2. W modalu edycji znajduje się przycisk "Odrzuć", który zamyka modal i usuwa kandydata z listy.
  3. Usunięty kandydat nie jest zapisywany w bazie danych.

### US-004
- Tytuł: Edycja i akceptacja pojedynczego kandydata
- Opis: Jako użytkownik, chcę mieć możliwość edycji treści kandydata na fiszkę przed jego zaakceptowaniem, aby upewnić się, że jest poprawny i zgodny z moimi oczekiwaniami.
- Kryteria akceptacji:
  1. Kliknięcie w kandydata otwiera modal z polami do edycji "przodu" i "tyłu".
  2. W modalu znajdują się przyciski "Zapisz i zaakceptuj", "Odrzuć" i "Anuluj".
  3. Po edycji i kliknięciu "Zapisz i zaakceptuj", fiszka jest zapisywana w bazie danych ze statusem `source` ustawionym na `ai_generated_edited`.
  4. Jeśli użytkownik nie dokonał edycji i kliknie "Zapisz i zaakceptuj", fiszka jest zapisywana w bazie ze statusem `source` ustawionym na `ai_generated`.
  5. Po zapisaniu, kandydat znika z listy recenzji.

### US-005
- Tytuł: Masowa akceptacja wszystkich kandydatów
- Opis: Jako użytkownik, chcę mieć możliwość zaakceptowania wszystkich wygenerowanych kandydatów jednym kliknięciem, jeśli uznam, że większość z nich jest dobra.
- Kryteria akceptacji:
  1. Kliknięcie przycisku "Zaakceptuj wszystkie" powoduje zapisanie wszystkich widocznych na liście kandydatów do bazy danych.
  2. Wszystkie zapisane w ten sposób fiszki otrzymują status `source` o wartości `ai_generated`.
  3. Po zakończeniu operacji lista kandydatów staje się pusta.

### US-006
- Tytuł: Ręczne tworzenie nowej fiszki
- Opis: Jako użytkownik, chcę mieć możliwość ręcznego dodania nowej fiszki, gdy mam konkretne pytanie i odpowiedź do zapamiętania.
- Kryteria akceptacji:
  1. Dostępny jest formularz z polami "Przód" (max 200 znaków) i "Tył" (max 500 znaków).
  2. Po wypełnieniu pól i kliknięciu "Zapisz", nowa fiszka jest dodawana do bazy danych.
  3. Fiszka otrzymuje status `source` o wartości `manual`.
  4. Formularz jest czyszczony po pomyślnym dodaniu fiszki.

### US-007
- Tytuł: Przeglądanie kolekcji zapisanych fiszek
- Opis: Jako użytkownik, chcę mieć dostęp do listy wszystkich moich zapisanych fiszek, aby móc je przeglądać i zarządzać nimi.
- Kryteria akceptacji:
  1. Istnieje dedykowany widok "Moje fiszki".
  2. Wszystkie zapisane fiszki są wyświetlane na jednej liście, posortowanej chronologicznie od najnowszej.
  3. Przy każdej fiszce znajdują się opcje "Edytuj" i "Usuń".

### US-008
- Tytuł: Edycja istniejącej fiszki
- Opis: Jako użytkownik, chcę móc edytować moje zapisane fiszki, aby poprawić błędy lub zaktualizować informacje.
- Kryteria akceptacji:
  1. Kliknięcie "Edytuj" przy fiszce otwiera formularz z jej aktualną treścią.
  2. Po dokonaniu zmian i zapisaniu, treść fiszki w bazie danych jest nadpisywana.
  3. Historia edycji nie jest śledzona.

### US-009
- Tytuł: Usuwanie fiszki z kolekcji
- Opis: Jako użytkownik, chcę móc trwale usunąć fiszkę z mojej kolekcji, gdy nie jest mi już potrzebna.
- Kryteria akceptacji:
  1. Kliknięcie "Usuń" przy fiszce wyświetla prośbę o potwierdzenie.
  2. Po potwierdzeniu, fiszka jest trwale usuwana z bazy danych.

### US-010
- Tytuł: Nauka z wykorzystaniem fiszek
- Opis: Jako użytkownik, chcę móc uczyć się z moich fiszek w prostym trybie, który pozwala mi ocenić moją znajomość odpowiedzi.
- Kryteria akceptacji:
  1. W trybie nauki wyświetlany jest przód fiszki.
  2. Dostępny jest przycisk "Sprawdź odpowiedź", który odsłania tył fiszki.
  3. Pod odpowiedzią pojawiają się trzy przyciski oceny: "Nie wiem", "Wiem", "Łatwe".
  4. Kliknięcie jednego z przycisków powoduje przejście do następnej fiszki.

### US-011
- Tytuł: Tworzenie nowego konta użytkownika
- Opis: Jako nowy użytkownik, chcę móc zarejestrować się w aplikacji za pomocą adresu e-mail i hasła, aby móc zapisywać swoje fiszki.
- Kryteria akceptacji:
  1. Formularz rejestracji wymaga podania adresu e-mail i hasła (z potwierdzeniem).
  2. System waliduje poprawność formatu adresu e-mail i sprawdza, czy hasła są identyczne.
  3. Po pomyślnej rejestracji, użytkownik jest automatycznie zalogowany.
  4. Hasło jest przechowywane w bazie w postaci zaszyfrowanej.

### US-012
- Tytuł: Logowanie do aplikacji
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji, aby uzyskać dostęp do moich fiszek.
- Kryteria akceptacji:
  1. Formularz logowania wymaga podania adresu e-mail i hasła.
  2. Po pomyślnym uwierzytelnieniu, użytkownik uzyskuje dostęp do swojego konta i swoich fiszek.
  3. W przypadku błędnych danych, wyświetlany jest odpowiedni komunikat.
  4. Dostęp do danych jest ograniczony tylko do zalogowanego użytkownika (RLS).

### US-013
- Tytuł: Walidacja limitów znaków
- Opis: Jako użytkownik, powinienem być informowany o limitach znaków w polach tekstowych, aby uniknąć błędów.
- Kryteria akceptacji:
  1. Pole do generowania fiszek z AI nie pozwala na wysłanie tekstu krótszego niż 100 i dłuższego niż 10 000 znaków; przy próbie naruszenia limitu użytkownik widzi komunikat.
  2. Pola "Przód" i "Tył" w formularzu ręcznego tworzenia/edycji mają walidację na odpowiednio 200 i 500 znaków.
  3. Interfejs wyświetla licznik znaków lub komunikat przy próbie przekroczenia limitu.

### US-014
- Tytuł: Obsługa błędów podczas generowania fiszek
- Opis: Jako użytkownik, w przypadku problemów z generowaniem fiszek przez AI, chcę otrzymać zrozumiały komunikat o błędzie.
- Kryteria akceptacji:
  1. Jeśli API do generowania fiszek zwróci błąd, wskaźnik ładowania znika.
  2. Użytkownikowi wyświetlany jest przyjazny komunikat, np. "Wystąpił błąd podczas generowania fiszek. Spróbuj ponownie później."
  3. Błąd jest logowany po stronie serwera w celu dalszej analizy.

## 6. Metryki sukcesu

### 6.1. Jakość generowania AI
- Cel: 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika (z edycją lub bez).
- Sposób pomiaru: Wprowadzona zostanie dedykowana tabela `generation_logs`, która będzie śledzić każdą sesję generowania. Będziemy analizować stosunek liczby kandydatów, które zostały zaakceptowane (bezpośrednio lub po edycji) do całkowitej liczby kandydatów wygenerowanych w danej sesji.
- Wzór: `(Liczba zaakceptowanych fiszek + Liczba edytowanych i zaakceptowanych fiszek) / Całkowita liczba wygenerowanych kandydatów >= 0.75`

### 6.2. Adopcja funkcji AI
- Cel: Użytkownicy tworzą 75% wszystkich swoich fiszek z wykorzystaniem generatora AI.
- Sposób pomiaru: Każda fiszka w bazie danych będzie miała pole `source` przechowujące informację o jej pochodzeniu (`manual`, `ai_generated`, `ai_generated_edited`). Metryka będzie obliczana jako stosunek liczby fiszek pochodzących z AI do całkowitej liczby fiszek w systemie.
- Wzór: `Liczba fiszek ze statusem 'ai_generated' lub 'ai_generated_edited' / Całkowita liczba fiszek w systemie >= 0.75`
