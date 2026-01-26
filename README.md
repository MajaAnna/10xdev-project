# AI Cards

An intelligent flashcard generator designed to accelerate your learning process. AI Cards transforms your notes, articles, and study materials into a deck of flashcards in seconds.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Testing](#testing)
- [Project Status](#project-status)
- [License](#license)

## Project Description

AI Cards is a web application built to solve the time-consuming problem of manual flashcard creation. The core feature is an AI-powered generator that automatically creates flashcard suggestions from user-pasted text. This allows students and professionals to quickly convert their digital notes into an effective study tool.

The application provides a full workflow, including a review system for AI-generated cards, manual creation and editing, and a simple learning mode to start studying immediately.

## Tech Stack

This project uses a modern, performant, and scalable tech stack:

- **Frontend:**
  - [Astro](https://astro.build/): High-performance web framework for content-driven sites.
  - [React](https://react.dev/): UI library for building interactive components.
  - [TypeScript](https://www.typescriptlang.org/): Static typing for robust and maintainable code.
  - [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework for rapid styling.
  - [Shadcn/ui](https://ui.shadcn.com/): A library of accessible and reusable React components.

- **Backend & Database:**
  - [Supabase](https://supabase.com/): An open-source Firebase alternative providing a PostgreSQL database, authentication, and a Backend-as-a-Service platform.

- **Artificial Intelligence:**
  - [OpenRouter.ai](https://openrouter.ai/): A unified API for accessing a wide range of large language models (from OpenAI, Anthropic, Google, etc.), enabling flexibility and cost optimization.

- **Testing:**
  - [Vitest](https://vitest.dev/): Fast unit testing framework with native TypeScript support and code coverage.
  - [Playwright](https://playwright.dev/): End-to-end testing framework for cross-browser testing (Chromium, Firefox, WebKit).
  - [Testing Library](https://testing-library.com/): React component testing with user-centric approach.
  - [MSW](https://mswjs.io/): API mocking for reliable and isolated tests.

- **DevOps & Hosting:**
  - [GitHub Actions](https://github.com/features/actions): For continuous integration and deployment pipelines with automated testing.
  - [Docker](https://www.docker.com/): For containerizing the application for consistent deployments.
  - [DigitalOcean](https://www.digitalocean.com/): For hosting the production application.

## Project Structure

```md
.
├── src/
│ ├── layouts/ # Astro layouts
│ ├── pages/ # Astro pages
│ │ └── api/ # API endpoints
│ ├── components/ # UI components (Astro & React)
│ └── assets/ # Static assets
├── public/ # Public assets
```

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

## Getting Started Locally

To set up and run this project on your local machine, follow these steps.

### Prerequisites

- Node.js: The required version is specified in the `.nvmrc` file. We recommend using [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) to manage Node.js versions.
- npm (or a compatible package manager like pnpm or yarn).

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-cards.git
cd ai-cards
```

### 2. Set Node.js Version

If you are using `nvm`, run the following command to switch to the correct Node.js version:

```bash
nvm use
```

### 3. Install Dependencies

Install the project dependencies using npm:

```bash
npm install
```

### 4. Set Up Environment Variables

Create a `.env` file in the root of the project by copying the example file:

```bash
cp .env.example .env
```

Now, open the `.env` file and add your credentials for Supabase and OpenRouter.

```env
# Supabase credentials
PUBLIC_SUPABASE_URL="your-supabase-project-url"
PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# OpenRouter API Key (used server-side)
OPENROUTER_API_KEY="your-openrouter-api-key"
```

### 5. Run the Development Server

Start the local development server:

```bash
npm run dev
```

The application should now be running at `http://localhost:4321`.

## Available Scripts

The following scripts are available in `package.json`:

### Development

| Script             | Description                                             |
| :----------------- | :------------------------------------------------------ |
| `npm run dev`      | Starts the local development server with hot-reloading. |
| `npm run build`    | Builds the application for production.                  |
| `npm run preview`  | Previews the production build locally.                  |

### Code Quality

| Script             | Description                                             |
| :----------------- | :------------------------------------------------------ |
| `npm run lint`     | Lints the codebase using ESLint.                        |
| `npm run lint:fix` | Automatically fixes fixable linting errors.             |
| `npm run format`   | Formats the entire codebase using Prettier.             |

### Testing (Coming Soon)

| Script                | Description                                                    |
| :-------------------- | :------------------------------------------------------------- |
| `npm run test`        | Runs all tests (unit + integration).                           |
| `npm run test:unit`   | Runs unit tests with Vitest.                                   |
| `npm run test:watch`  | Runs tests in watch mode for development.                      |
| `npm run test:coverage` | Generates code coverage report.                              |
| `npm run test:e2e`    | Runs end-to-end tests with Playwright.                         |
| `npm run test:e2e:headed` | Runs E2E tests with visible browser for debugging.        |

> **Note:** Testing scripts will be added as the testing infrastructure is implemented. See `.ai/test-plan.md` for the comprehensive testing strategy.

## Project Scope

### Key Features (MVP)

- **AI Flashcard Generation:** Generate flashcards from pasted text.
- **Review System:** Accept, edit, or reject AI-generated suggestions before saving.
- **Manual Creation:** Manually create and edit flashcards.
- **User Accounts:** Secure user accounts for storing and managing flashcards.
- **Simple Learning Mode:** A basic interface to review saved flashcards.

### Out of Scope (for now)

- Advanced spaced repetition algorithms (e.g., SM-2).
- Importing from file formats like PDF or DOCX.
- Sharing flashcard decks between users.
- Integrations with other educational platforms.
- Native mobile applications (iOS/Android).

## Testing

This project follows a comprehensive testing strategy to ensure high quality and reliability.

### Testing Stack

- **Unit & Integration Tests:** [Vitest](https://vitest.dev/) - Fast, modern testing framework with native TypeScript support
- **E2E Tests:** [Playwright](https://playwright.dev/) - Cross-browser testing (Chromium, Firefox, WebKit)
- **Component Tests:** [Testing Library](https://testing-library.com/) - User-centric React component testing
- **API Mocking:** [MSW](https://mswjs.io/) - Mock Service Worker for reliable API testing

### Testing Strategy

Our testing approach covers multiple layers:

1. **Unit Tests** - Individual functions and components (Target: 80% coverage)
2. **Integration Tests** - API endpoints and database interactions
3. **E2E Tests** - Complete user workflows in real browsers
4. **Security Tests** - Row Level Security (RLS) and authentication
5. **Performance Tests** - Load testing and frontend performance audits

### Test Plan

For detailed information about our testing strategy, test cases, and quality assurance processes, see:
- **[Test Plan](.ai/test-plan.md)** - Comprehensive testing documentation (2000+ lines)
- Includes 35+ test cases covering all MVP features
- Testing schedule, tools, and acceptance criteria
- Security, performance, and accessibility testing guidelines

### Running Tests

```bash
# Unit tests
npm run test              # Run all unit tests
npm run test:watch        # Watch mode (auto-rerun on changes)
npm run test:ui           # Interactive UI mode
npm run test:coverage     # Generate coverage report

# E2E tests
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Interactive UI mode
npm run test:e2e:debug    # Debug mode (step-by-step)
npm run test:e2e:report   # Show last test report
```

### Quick Start

For a quick introduction to testing in this project, see:
- **[Testing Quick Start](TESTING_QUICKSTART.md)** - Get started in 5 minutes
- **[Testing Guide](TESTING.md)** - Comprehensive testing documentation
- **[Unit Tests Guide](tests/README.md)** - Vitest and Testing Library
- **[E2E Tests Guide](e2e/README.md)** - Playwright testing

### Test Coverage

Current test status:
- ✅ **27 unit tests** - All passing
- ✅ **18 E2E tests** - Configured and ready
- ✅ **CI/CD pipeline** - Automated testing on every PR
- 📊 **Coverage target:** 70%+ for all metrics

## Project Status

**Status:** In Development 🏗️

This project is currently in the **Minimum Viable Product (MVP)** development phase. Core features are being built and refined.

### Current Focus
- ✅ Core features implemented (AI generation, flashcard management, study mode)
- ✅ Authentication and authorization with Supabase
- ✅ Testing infrastructure fully configured (Vitest + Playwright)
- ✅ Comprehensive test plan documented
- 🔄 Writing tests for core features (in progress)

### TO DO:
- Refactor
- E2E tests
- Unit tests development
- Save All - batch save process
- Study sessions
- Design

## License

This project is licensed under the **MIT License**.
