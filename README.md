# AI Cards

An intelligent flashcard generator designed to accelerate your learning process. AI Cards transforms your notes, articles, and study materials into a deck of flashcards in seconds.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

AI Cards is a web application built to solve the time-consuming problem of manual flashcard creation. The core feature is an AI-powered generator that automatically creates flashcard suggestions from user-pasted text. This allows students and professionals to quickly convert their digital notes into an effective study tool.

The application provides a full workflow, including a review system for AI-generated cards, manual creation and editing, and a simple learning mode to start studying immediately.

## Tech Stack

This project uses a modern, performant, and scalable tech stack:

-   **Frontend:**
    -   [Astro](https://astro.build/): High-performance web framework for content-driven sites.
    -   [React](https://react.dev/): UI library for building interactive components.
    -   [TypeScript](https://www.typescriptlang.org/): Static typing for robust and maintainable code.
    -   [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework for rapid styling.
    -   [Shadcn/ui](https://ui.shadcn.com/): A library of accessible and reusable React components.

-   **Backend & Database:**
    -   [Supabase](https://supabase.com/): An open-source Firebase alternative providing a PostgreSQL database, authentication, and a Backend-as-a-Service platform.

-   **Artificial Intelligence:**
    -   [OpenRouter.ai](https://openrouter.ai/): A unified API for accessing a wide range of large language models (from OpenAI, Anthropic, Google, etc.), enabling flexibility and cost optimization.

-   **DevOps & Hosting:**
    -   [GitHub Actions](https://github.com/features/actions): For continuous integration and deployment pipelines.
    -   [Docker](https://www.docker.com/): For containerizing the application for consistent deployments.
    -   [DigitalOcean](https://www.digitalocean.com/): For hosting the production application.

## Project Structure

```md
.
├── src/
│   ├── layouts/    # Astro layouts
│   ├── pages/      # Astro pages
│   │   └── api/    # API endpoints
│   ├── components/ # UI components (Astro & React)
│   └── assets/     # Static assets
├── public/         # Public assets
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

-   Node.js: The required version is specified in the `.nvmrc` file. We recommend using [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) to manage Node.js versions.
-   npm (or a compatible package manager like pnpm or yarn).

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

| Script       | Description                                          |
| :----------- | :--------------------------------------------------- |
| `npm run dev`    | Starts the local development server with hot-reloading. |
| `npm run build`  | Builds the application for production.               |
| `npm run preview`| Previews the production build locally.               |
| `npm run lint`   | Lints the codebase using ESLint.                     |
| `npm run lint:fix`| Automatically fixes fixable linting errors.          |
| `npm run format` | Formats the entire codebase using Prettier.          |

## Project Scope

### Key Features (MVP)

-   **AI Flashcard Generation:** Generate flashcards from pasted text.
-   **Review System:** Accept, edit, or reject AI-generated suggestions before saving.
-   **Manual Creation:** Manually create and edit flashcards.
-   **User Accounts:** Secure user accounts for storing and managing flashcards.
-   **Simple Learning Mode:** A basic interface to review saved flashcards.

### Out of Scope (for now)

-   Advanced spaced repetition algorithms (e.g., SM-2).
-   Importing from file formats like PDF or DOCX.
-   Sharing flashcard decks between users.
-   Integrations with other educational platforms.
-   Native mobile applications (iOS/Android).

## Project Status

**Status:** In Development 🏗️

This project is currently in the **Minimum Viable Product (MVP)** development phase. Core features are being built and refined.

## License

This project is licensed under the **MIT License**.