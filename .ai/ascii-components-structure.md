# Component Architecture & Dependencies

## Overview
This document provides a visual representation of the component structure and dependencies in the 10xdev Flashcards application.

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ASTRO PAGES LAYER                                  │
│                         (Server-Side Routing)                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│  index.astro  │          │ generate.astro│          │  cards.astro  │
│   (Landing)   │          │  (Generator)  │          │  (My Cards)   │
└───────────────┘          └───────────────┘          └───────────────┘
                                    │                           │
        ┌───────────────────────────┼───────────────────────────┤
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│ study.astro   │          │ profile.astro │          │ auth/*.astro  │
│   (Study)     │          │   (Profile)   │          │ (Login/Reg)   │
└───────────────┘          └───────────────┘          └───────────────┘
        │                           │                           │
        │                           │                           │
        └───────────────────────────┴───────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REACT VIEW COMPONENTS                                │
│                      (Main Feature Components)                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Main View Components & Their Dependencies

### 1. FlashcardsGeneratorView
```
┌──────────────────────────────────────────────────────────────────┐
│              FlashcardsGeneratorView.tsx                          │
│                   (Generator Page)                                │
└──────────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ GenerationForm│  │CandidateReview│  │EditCandidate │
│              │  │     List      │  │    Modal     │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        │                 ▼                 │
        │         ┌──────────────┐          │
        │         │ CandidateCard│          │
        │         └──────────────┘          │
        │                                   │
        └───────────────┬───────────────────┘
                        │
                        ▼
        ┌────────────────────────────────┐
        │  useFlashcardGenerator Hook    │
        │  ┌──────────────────────────┐  │
        │  │ State Management:        │  │
        │  │ - candidates[]           │  │
        │  │ - state (idle/loading/   │  │
        │  │   reviewing/error)       │  │
        │  │ - generationId           │  │
        │  │ - candidateToEdit        │  │
        │  └──────────────────────────┘  │
        │  ┌──────────────────────────┐  │
        │  │ Actions:                 │  │
        │  │ - generateCandidates()   │  │
        │  │ - acceptSingleCandidate()│  │
        │  │ - rejectCandidate()      │  │
        │  │ - openEditModal()        │  │
        │  │ - reset()                │  │
        │  └──────────────────────────┘  │
        └────────────────────────────────┘
                        │
                        ▼
                ┌──────────────┐
                │ API Endpoints│
                │ /api/        │
                │ generations  │
                │ /api/        │
                │ flashcards   │
                └──────────────┘
```

### 2. MyCardsView
```
┌──────────────────────────────────────────────────────────────────┐
│                    MyCardsView.tsx                                │
│                   (Cards Management)                              │
└──────────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│SavedCardGrid │  │ManualCard    │  │ EditCard     │
│              │  │   Modal      │  │   Modal      │
└──────────────┘  └──────────────┘  └──────────────┘
        │                                   │
        ▼                                   ▼
┌──────────────┐                  ┌──────────────┐
│  SavedCard   │                  │DeleteConfirm │
│              │                  │   Dialog     │
└──────────────┘                  └──────────────┘
        │
        └───────────────┬───────────────────┘
                        │
                        ▼
        ┌────────────────────────────────┐
        │      useMyCards Hook           │
        │  ┌──────────────────────────┐  │
        │  │ State Management:        │  │
        │  │ - cards[]                │  │
        │  │ - isLoading              │  │
        │  │ - isSubmitting           │  │
        │  │ - error                  │  │
        │  └──────────────────────────┘  │
        │  ┌──────────────────────────┐  │
        │  │ Actions:                 │  │
        │  │ - addCard()              │  │
        │  │ - updateCard()           │  │
        │  │ - deleteCard()           │  │
        │  │ - fetchCards()           │  │
        │  └──────────────────────────┘  │
        └────────────────────────────────┘
                        │
                        ▼
                ┌──────────────┐
                │ API Client   │
                │ /lib/api/    │
                │ flashcards.ts│
                └──────────────┘
```

### 3. StudyView
```
┌──────────────────────────────────────────────────────────────────┐
│                      StudyView.tsx                                │
│                    (Study Session)                                │
└──────────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│StudyProgress │  │ Flashcard    │  │   Study      │
│     Bar      │  │   Viewer     │  │  Controls    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                                   │
        │                                   ▼
        │                          ┌──────────────┐
        │                          │SessionEnd    │
        │                          │  Message     │
        │                          └──────────────┘
        │
        └───────────────┬───────────────────┘
                        │
                        ▼
        ┌────────────────────────────────┐
        │    useStudySession Hook        │
        │  ┌──────────────────────────┐  │
        │  │ State Management:        │  │
        │  │ - status (loading/ready/ │  │
        │  │   finished/error)        │  │
        │  │ - allCards[]             │  │
        │  │ - studyQueue[]           │  │
        │  │ - currentIndex           │  │
        │  │ - isAnswerVisible        │  │
        │  └──────────────────────────┘  │
        │  ┌──────────────────────────┐  │
        │  │ Actions:                 │  │
        │  │ - showAnswer()           │  │
        │  │ - evaluateCard()         │  │
        │  │ - restartSession()       │  │
        │  │ - shuffleArray()         │  │
        │  └──────────────────────────┘  │
        └────────────────────────────────┘
                        │
                        ▼
                ┌──────────────┐
                │ API Endpoint │
                │ /api/        │
                │ flashcards   │
                └──────────────┘
```

### 4. UserProfileView
```
┌──────────────────────────────────────────────────────────────────┐
│                  UserProfileView.tsx                              │
│                    (User Profile)                                 │
└──────────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│UserProfile   │  │  SignOut     │  │   Card       │
│   Display    │  │   Button     │  │  (Shadcn)    │
└──────────────┘  └──────────────┘  └──────────────┘
        │
        └───────────────┬───────────────────┘
                        │
                        ▼
        ┌────────────────────────────────┐
        │   Direct State Management      │
        │  ┌──────────────────────────┐  │
        │  │ Local State:             │  │
        │  │ - userProfile            │  │
        │  │ - isLoading              │  │
        │  │ - error                  │  │
        │  └──────────────────────────┘  │
        │  ┌──────────────────────────┐  │
        │  │ API Calls:               │  │
        │  │ - supabaseClient.auth    │  │
        │  │   .getUser()             │  │
        │  │ - countFlashcardsForUser()│ │
        │  │ - /api/auth/logout       │  │
        │  └──────────────────────────┘  │
        └────────────────────────────────┘
```

### 5. Authentication Forms
```
┌──────────────────────────────────────────────────────────────────┐
│              LoginForm.tsx / RegisterForm.tsx                     │
│                   (Authentication)                                │
└──────────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Form       │  │    Input     │  │   Button     │
│  (Shadcn)    │  │  (Shadcn)    │  │  (Shadcn)    │
└──────────────┘  └──────────────┘  └──────────────┘
        │
        └───────────────┬───────────────────┘
                        │
                        ▼
        ┌────────────────────────────────┐
        │   React Hook Form + Zod        │
        │  ┌──────────────────────────┐  │
        │  │ Form Management:         │  │
        │  │ - zodResolver            │  │
        │  │ - useForm hook           │  │
        │  │ - validation schemas     │  │
        │  └──────────────────────────┘  │
        └────────────────────────────────┘
                        │
                        ▼
                ┌──────────────┐
                │ API Endpoints│
                │ /api/auth/   │
                │ login        │
                │ /api/auth/   │
                │ register     │
                └──────────────┘
```

---

## Navigation Component

### TopNav
```
┌──────────────────────────────────────────────────────────────────┐
│                       TopNav.tsx                                  │
│              (Global Navigation Component)                        │
└──────────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│NavigationMenu│  │    Sheet     │  │  SignOut     │
│  (Desktop)   │  │  (Mobile)    │  │   Button     │
└──────────────┘  └──────────────┘  └──────────────┘
        │
        └───────────────┬───────────────────┘
                        │
                        ▼
        ┌────────────────────────────────┐
        │   Navigation Logic             │
        │  ┌──────────────────────────┐  │
        │  │ Links (Logged In):       │  │
        │  │ - /generate (Generator)  │  │
        │  │ - /cards (My Cards)      │  │
        │  │ - /study (Study)         │  │
        │  │ - /profile (Profile)     │  │
        │  └──────────────────────────┘  │
        │  ┌──────────────────────────┐  │
        │  │ Links (Logged Out):      │  │
        │  │ - /auth/login            │  │
        │  │ - /auth/register         │  │
        │  └──────────────────────────┘  │
        └────────────────────────────────┘
```

---

## Shared UI Components (Shadcn/ui)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         UI COMPONENT LIBRARY                                 │
│                            (src/components/ui/)                              │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ├─── button.tsx ──────────────► Used by: All interactive components
        ├─── card.tsx ────────────────► Used by: SavedCard, CandidateCard, Forms
        ├─── dialog.tsx ──────────────► Used by: EditCardModal, ManualCardModal
        ├─── alert-dialog.tsx ────────► Used by: DeleteConfirmationDialog
        ├─── form.tsx ────────────────► Used by: LoginForm, RegisterForm, GenerationForm
        ├─── input.tsx ───────────────► Used by: All forms
        ├─── textarea.tsx ────────────► Used by: Card creation/editing
        ├─── label.tsx ───────────────► Used by: All forms
        ├─── spinner.tsx ─────────────► Used by: Loading states
        ├─── sonner.tsx ──────────────► Used by: Toast notifications
        ├─── sheet.tsx ───────────────► Used by: TopNav (mobile menu)
        ├─── navigation-menu.tsx ─────► Used by: TopNav
        └─── alert.tsx ───────────────► Used by: StudyView error states
```

---

## Backend Services Layer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API ENDPOINTS                                      │
│                         (src/pages/api/)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ├─── /api/flashcards ─────────┐
        │    - GET (list)              │
        │    - POST (create)           │
        │                              │
        ├─── /api/flashcards/[id] ────┤
        │    - PATCH (update)          │
        │    - DELETE (delete)         │
        │                              │
        ├─── /api/generations ────────┤
        │    - POST (generate AI)      │
        │                              │
        └─── /api/auth/ ──────────────┤
             - POST login              │
             - POST register           │
             - POST logout             │
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                       │
│                        (src/lib/services/)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ├─── flashcard.service.ts ────┐
        │    ┌──────────────────────┐ │
        │    │ - createFlashcard()  │ │
        │    │ - listFlashcards()   │ │
        │    │ - updateFlashcard()  │ │
        │    │ - deleteFlashcard()  │ │
        │    │ - countFlashcards()  │ │
        │    └──────────────────────┘ │
        │                              │
        ├─── generation.service.ts ───┤
        │    ┌──────────────────────┐ │
        │    │ - createGeneration() │ │
        │    │ - validateOwnership()│ │
        │    └──────────────────────┘ │
        │                              │
        └─── openrouter.service.ts ───┤
             ┌──────────────────────┐ │
             │ - generateFlashcards│ │
             │   (AI Integration)  │ │
             └──────────────────────┘ │
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                                       │
│                       (src/db/ + Supabase)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ├─── supabase.client.ts ──────► Client-side Supabase instance
        ├─── supabase.server.ts ──────► Server-side Supabase instance
        └─── database.types.ts ───────► Auto-generated TypeScript types
                                       │
                                       ▼
                              ┌──────────────┐
                              │   Supabase   │
                              │   Database   │
                              │              │
                              │ Tables:      │
                              │ - users      │
                              │ - flashcards │
                              │ - generations│
                              └──────────────┘
```

---

## Data Flow Patterns

### 1. Flashcard Generation Flow
```
User Input (GenerationForm)
        │
        ▼
useFlashcardGenerator.generateCandidates()
        │
        ▼
POST /api/generations
        │
        ▼
generation.service.createGeneration()
        │
        ▼
openrouter.service.generateFlashcards() ──► OpenRouter AI API
        │
        ▼
Return candidates to frontend
        │
        ▼
CandidateReviewList displays candidates
        │
        ▼
User accepts candidate
        │
        ▼
useFlashcardGenerator.acceptSingleCandidate()
        │
        ▼
POST /api/flashcards
        │
        ▼
flashcard.service.createFlashcard()
        │
        ▼
Supabase Database (flashcards table)
```

### 2. Card Management Flow
```
MyCardsView loads
        │
        ▼
useMyCards.fetchCards()
        │
        ▼
GET /api/flashcards
        │
        ▼
flashcard.service.listFlashcards()
        │
        ▼
Supabase Database query
        │
        ▼
Display cards in SavedCardGrid
        │
        ├─── User clicks Edit ──► EditCardModal ──► useMyCards.updateCard()
        │                                                    │
        │                                                    ▼
        │                                          PATCH /api/flashcards/[id]
        │                                                    │
        │                                                    ▼
        │                                    flashcard.service.updateFlashcard()
        │
        └─── User clicks Delete ──► DeleteConfirmationDialog ──► useMyCards.deleteCard()
                                                                           │
                                                                           ▼
                                                               DELETE /api/flashcards/[id]
                                                                           │
                                                                           ▼
                                                           flashcard.service.deleteFlashcard()
```

### 3. Study Session Flow
```
StudyView loads
        │
        ▼
useStudySession.fetchFlashcards()
        │
        ▼
GET /api/flashcards
        │
        ▼
Shuffle cards into studyQueue
        │
        ▼
Display current card in FlashcardViewer
        │
        ├─── User clicks "Show Answer" ──► useStudySession.showAnswer()
        │                                            │
        │                                            ▼
        │                                   Display card back
        │
        └─── User evaluates (Knew It / Didn't Know) ──► useStudySession.evaluateCard()
                                                                  │
                                                                  ▼
                                                         Move to next card
                                                                  │
                                                                  ▼
                                                   If last card ──► SessionEndMessage
```

---

## Custom Hooks Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CUSTOM HOOKS LAYER                                    │
│                     (src/components/hooks/)                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────┐
│  useFlashcardGenerator.ts      │
│  ┌──────────────────────────┐  │
│  │ Purpose:                 │  │
│  │ Manages AI flashcard     │  │
│  │ generation workflow      │  │
│  │                          │  │
│  │ Responsibilities:        │  │
│  │ - Generate candidates    │  │
│  │ - Accept/reject cards    │  │
│  │ - Edit modal state       │  │
│  │ - Optimistic updates     │  │
│  │ - Error handling         │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘

┌────────────────────────────────┐
│      useMyCards.ts             │
│  ┌──────────────────────────┐  │
│  │ Purpose:                 │  │
│  │ Manages user's flashcard │  │
│  │ collection               │  │
│  │                          │  │
│  │ Responsibilities:        │  │
│  │ - Fetch cards            │  │
│  │ - CRUD operations        │  │
│  │ - Optimistic updates     │  │
│  │ - Loading states         │  │
│  │ - Error handling         │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘

┌────────────────────────────────┐
│    useStudySession.ts          │
│  ┌──────────────────────────┐  │
│  │ Purpose:                 │  │
│  │ Manages study session    │  │
│  │ state and flow           │  │
│  │                          │  │
│  │ Responsibilities:        │  │
│  │ - Fetch flashcards       │  │
│  │ - Shuffle cards          │  │
│  │ - Track progress         │  │
│  │ - Show/hide answers      │  │
│  │ - Session restart        │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

## Type System & Schemas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TYPE DEFINITIONS                                    │
│                            (src/types.ts)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ├─── Entities (Database Models)
        │    - FlashcardEntity
        │    - GenerationEntity
        │    - UserEntity
        │
        ├─── DTOs (Data Transfer Objects)
        │    - FlashcardDto
        │    - GenerationResponseDto
        │    - ListFlashcardsResponseDto
        │
        ├─── Commands (Write Operations)
        │    - CreateFlashcardCommand
        │    - UpdateFlashcardCommand
        │    - CreateGenerationCommand
        │
        └─── View Models
             - UserProfileViewModel
             - FlashcardCandidateVM

┌─────────────────────────────────────────────────────────────────────────────┐
│                        VALIDATION SCHEMAS                                    │
│                         (src/lib/schemas/)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ├─── flashcard.schemas.ts
        │    - ManualCardFormSchema
        │    - UpdateFlashcardSchema
        │
        └─── generation.schemas.ts
             - GenerationRequestSchema
             - GenerationResponseSchema
```

---

## Error Handling Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ERROR CLASSES                                        │
│                        (src/lib/errors/)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ├─── common.errors.ts
        │    - NotFoundError
        │    - ValidationError
        │    - UnauthorizedError
        │
        ├─── flashcard.errors.ts
        │    - FlashcardCreationError
        │    - GenerationNotFoundError
        │
        └─── generation.errors.ts
             - GenerationError
             - AIServiceError

Flow:
Service Layer throws error
        │
        ▼
API Endpoint catches error
        │
        ▼
Returns appropriate HTTP status + JSON error
        │
        ▼
Frontend receives error
        │
        ▼
Display via toast notification (sonner)
```

---

## Key Design Patterns

### 1. **Container/Presenter Pattern**
- View components (e.g., `FlashcardsGeneratorView`) act as containers
- Smaller components (e.g., `CandidateCard`) act as presenters
- Custom hooks manage state and business logic

### 2. **Optimistic Updates**
- `useMyCards` and `useFlashcardGenerator` implement optimistic UI updates
- Update UI immediately, rollback on error
- Provides better UX with instant feedback

### 3. **Service Layer Pattern**
- Business logic separated into service files
- API endpoints are thin controllers
- Services handle database operations and validation

### 4. **Repository Pattern**
- Supabase client abstraction
- Separate client/server instances
- Type-safe database operations

### 5. **Form Management**
- React Hook Form + Zod for validation
- Shadcn/ui form components
- Consistent error handling

---

## Component Dependency Graph

```
Legend:
  ──► Direct dependency
  ═══► Data flow
  ···► Indirect dependency

┌──────────────┐
│ Astro Pages  │
└──────────────┘
       │
       ├──► Layout.astro ──► TopNav
       │
       ├──► FlashcardsGeneratorView ──► useFlashcardGenerator ═══► /api/generations
       │                              │                         ═══► /api/flashcards
       │                              ├──► GenerationForm
       │                              ├──► CandidateReviewList ──► CandidateCard
       │                              └──► EditCandidateModal
       │
       ├──► MyCardsView ──► useMyCards ═══► /api/flashcards
       │                  │
       │                  ├──► SavedCardGrid ──► SavedCard
       │                  ├──► ManualCardModal
       │                  ├──► EditCardModal
       │                  └──► DeleteConfirmationDialog
       │
       ├──► StudyView ──► useStudySession ═══► /api/flashcards
       │                │
       │                ├──► FlashcardViewer
       │                ├──► StudyControls
       │                ├──► StudyProgressBar
       │                └──► SessionEndMessage
       │
       ├──► UserProfileView ═══► supabaseClient.auth
       │                      │ ═══► /api/auth/logout
       │                      │
       │                      ├──► UserProfileDisplay
       │                      └──► SignOutButton
       │
       └──► LoginForm/RegisterForm ═══► /api/auth/login
                                     ═══► /api/auth/register
                                     │
                                     └──► Shadcn/ui components

All components ···► Shadcn/ui library (button, card, dialog, etc.)
```

---

## Technology Stack Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND STACK                                     │
└─────────────────────────────────────────────────────────────────────────────┘
├─ Framework: Astro 5 (SSR + Static)
├─ UI Library: React 19 (for interactive components)
├─ Styling: Tailwind CSS 4
├─ Component Library: Shadcn/ui
├─ Form Management: React Hook Form + Zod
├─ State Management: Custom hooks (useState, useEffect)
├─ Notifications: Sonner (toast notifications)
└─ Icons: Lucide React

┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND STACK                                      │
└─────────────────────────────────────────────────────────────────────────────┘
├─ Runtime: Node.js (via Astro SSR)
├─ API: Astro Server Endpoints
├─ Database: Supabase (PostgreSQL)
├─ Authentication: Supabase Auth
├─ AI Integration: OpenRouter API
├─ Validation: Zod schemas
└─ Type Safety: TypeScript 5

┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT TOOLS                                    │
└─────────────────────────────────────────────────────────────────────────────┘
├─ Testing: Vitest (unit) + Playwright (e2e)
├─ Linting: ESLint
├─ Type Checking: TypeScript
└─ Build: Astro build system
```

---

## Notes

- All React components use functional components with hooks (no class components)
- Custom hooks encapsulate business logic and state management
- Optimistic updates provide instant UI feedback
- Error handling is consistent across all layers
- Type safety is enforced throughout the application
- Shadcn/ui provides a consistent design system
- API endpoints are thin controllers that delegate to service layer
- Services handle all business logic and database operations

