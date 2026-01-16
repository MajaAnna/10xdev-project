import type {
  ListFlashcardsResponseDto,
  ListFlashcardsQueryParams,
  CreateFlashcardCommand,
  FlashcardDto,
  UpdateFlashcardCommand,
  DeleteFlashcardResponseDto,
} from "@/types";

export async function getFlashcards(params: ListFlashcardsQueryParams): Promise<ListFlashcardsResponseDto> {
  const query = new URLSearchParams({
    limit: params.limit?.toString() ?? "50",
    page: params.page?.toString() ?? "1",
  });

  const response = await fetch(`/api/flashcards?${query.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch flashcards");
  }

  const data: ListFlashcardsResponseDto = await response.json();
  return data;
}

export async function createFlashcard(data: CreateFlashcardCommand): Promise<FlashcardDto> {
  const response = await fetch("/api/flashcards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message ?? "Failed to create flashcard");
  }

  return response.json();
}

export async function updateFlashcard(id: number, data: UpdateFlashcardCommand): Promise<FlashcardDto> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message ?? "Failed to update flashcard");
  }

  return response.json();
}

export async function deleteFlashcard(id: number): Promise<DeleteFlashcardResponseDto> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message ?? "Failed to delete flashcard");
  }

  return response.json();
}
