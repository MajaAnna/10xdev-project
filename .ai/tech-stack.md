Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

Testing - Kompleksowe testowanie aplikacji:

- Vitest jako framework do testów jednostkowych i integracyjnych
  - Szybkie wykonywanie testów dzięki natywnej integracji z Vite
  - Kompatybilność API z Jest dla łatwej migracji
  - Wsparcie dla TypeScript out-of-the-box
  - Pokrycie kodu (code coverage) z v8 lub istanbul
- Playwright do testów end-to-end (E2E)
  - Testowanie w rzeczywistych przeglądarkach (Chromium, Firefox, WebKit)
  - Cross-browser testing dla zapewnienia kompatybilności
  - Automatyczne czekanie na elementy (auto-waiting)
  - Możliwość debugowania z Playwright Inspector
- Testing Library dla testów komponentów React
  - @testing-library/react do testowania komponentów
  - @testing-library/user-event do symulacji interakcji użytkownika
- MSW (Mock Service Worker) do mockowania API w testach

CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD
  - Automatyczne uruchamianie testów przy każdym pull request
  - Linting i formatowanie kodu
  - Build i deployment
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker
