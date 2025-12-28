# UI Architecture for AI Cards

## 1. UI Structure Overview

The UI architecture is designed as a single-page application (SPA) experience built with Astro and React. Astro will serve the main pages (routes), while React will power the interactive components ("islands of interactivity") within those pages. The structure is centered around a main dashboard that serves as the primary workspace for AI generation and review, minimizing context switching for the user. Navigation is handled by a persistent top bar. The component library Shadcn/ui will be used extensively to ensure a consistent, accessible, and modern user interface. State management will be handled locally within components using React Hooks (`useState`) and shared across components where necessary via React Context (`useContext`).

## 2. Views List

- **View Name:** Login
  - **View Path:** `/auth/login`
  - **Main Purpose:** To authenticate the user. For the MVP, this will be a placeholder page to establish the routing and user flow.
  - **Key Components:** Login Form (mock).
  - **UX, Accessibility, and Security:** This page will be the entry point. In the future, it will handle secure credential submission. For MVP, it will simply redirect to the dashboard.

- **View Name:** Flashcards generator
  - **View Path:** `/generate`
  - **Main Purpose:** To serve as the central hub for generating and reviewing AI-powered flashcards. It combines the text input and candidate review into a single, unified view.
  - **Key Components:** `GenerationForm` (React component with a textarea for source text and a "Generate" button), `CandidateReviewList` (a list of generated cards that appears on this page after generation), `EditCandidateModal` (a dialog for editing and accepting a single candidate or cancelling action), `SaveAllFlashcards` button (mock for MVP), spinner (skeleton).
  - **UX, Accessibility, and Security:** This view is the core of the user experience, designed to be fast and iterative. Loading states will be shown during generation. All interactive elements will be keyboard-accessible. Frontend validation will prevent invalid data submission.

- **View Name:** My Cards
  - **View Path:** `/cards`
  - **Main Purpose:** To allow users to view, manage, and manually create their saved flashcards.
  - **Key Components:** `SavedCardGrid` (a responsive grid of saved cards), `SavedCard` (component for an individual card with edit/delete controls), `ManualCardModal` (a dialog for creating a new card from scratch), `EditCardModal`, `DeleteConfirmationDialog`.
  - **UX, Accessibility, and Security:** Provides a clear overview of the user's collection. An empty state will guide new users. All actions will be performed in accessible modals. `Optimistic UI` updates will be used for a smoother experience. For MVP, this view will fetch and display only the latest 20 cards.

- **View Name:** Study
  - **View Path:** `/study`
  - **Main Purpose:** To provide a minimal interface for a learning session.
  - **Key Components:** `StudySession` (manages the flow), `FlashcardViewer` (displays the card), `ShowAnswer` button, `FlashcardKnown`, `FlascardToStudy` buttons, `SessionEndMessage`.
  - **UX, Accessibility, and Security:** A simple, distraction-free environment. For MVP, it cycles through cards and shows a completion message at the end, with options to restart or return to the dashboard.

- **View Name:** User Profile
  - **View Path:** `/profile`
  - **Main Purpose:** To serve as a placeholder for future account management features.
  - **Key Components:** `UserProfileDisplay` (shows mock user data), "Sign Out" button.
  - **UX, Accessibility, and Security:** Establishes the location for user settings. The sign-out button will redirect to the login page.

## 3. User Journey Map

The primary user journey is designed to be efficient and centered around the core value proposition of the application.

1.  **Authentication:** The user starts at `/auth/login` and is immediately redirected to the Dashboard (`/`).
2.  **Generation:** On the Dashboard, the user pastes text into the `GenerationForm` and clicks "Generate".
    - The UI enters a loading state.
3.  **Review:** The page updates, displaying the `CandidateReviewList` below the form.
4.  **Interaction with Candidates:**
    - **Accept:** The user clicks a candidate, which opens the `EditCandidateModal`. They can edit the content and click "Save and Accept". This triggers `POST /api/flashcards`. The card is optimistically removed from the review list.
    - **Reject:** The user clicks a "Reject" icon on a candidate card. The card is optimistically removed from the client-side list.
    - **Bulk Save (Placeholder):** The user clicks "Save All". A toast notification informs them the feature is not yet available.
5.  **Managing Cards:** The user navigates to `/cards` via the top navigation.
    - The view fetches and displays their saved flashcards.
    - They can click "Edit" or "Delete" on a card, performing the action within a modal (`PATCH` or `DELETE /api/flashcards/:id`).
    - They can click "Create New Card" to open the `ManualCardModal` and save a new card (`POST /api/flashcards`).
6.  **Studying:** The user navigates to `/study`, where they can cycle through their saved cards.

## 4. Layout and Navigation Structure

- **Overall Layout:** A main layout component (`Layout.astro`) will wrap all pages, ensuring consistency. It will contain the top navigation bar.
- **Navigation:**
  - A persistent **Top Navigation Bar** (`TopNav.tsx`) will be the primary method of navigation.
  - It will be implemented using Shadcn/ui's `NavigationMenu`.
  - Links will include **Dashboard (`/`)**, **My Cards (`/cards`)**, **Study (`/study`)**, and a user icon linking to **Profile (`/profile`)**.
  - The navigation component will receive the current URL path to visually highlight the active page, providing clear orientation for the user.

## 5. Key Components

- **`AuthContext` (React Context):** A global provider that supplies a mock user object throughout the application, preparing the architecture for future JWT-based authentication without requiring rewrites.
- **`GenerationForm` (React Component):** Contains the text area and logic for calling the `POST /api/generations` endpoint. Manages loading and inline error states for the generation process.
- **`CandidateReviewList` (React Component):** Manages the client-side state of the AI-generated candidates. Handles the removal of candidates as they are accepted or rejected.
- **Modals (`Dialog` components from Shadcn/ui):**
  - **`EditCandidateModal`:** For editing and accepting candidates on the Dashboard.
  - **`ManualCardModal` / `EditCardModal`:** For creating/editing saved cards on the "My Cards" page.
  - **`DeleteConfirmationDialog`:** To prevent accidental deletion of saved cards.
- **`SavedCardGrid` (React Component):** Fetches data from `GET /api/flashcards` and renders the list of cards in a responsive grid. Manages the display of an empty state.
