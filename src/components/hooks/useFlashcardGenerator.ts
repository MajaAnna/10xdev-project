import { useState, useRef } from "react";
import type { GenerationResponseDto, CreateFlashcardCommand } from "@/types";

export interface FlashcardCandidateVM {
  id: string; // Client-side unique ID
  front: string;
  back: string;
}

export type GenerationState = "idle" | "loading" | "reviewing" | "saving" | "error";

export function useFlashcardGenerator() {
  const [state, setState] = useState<GenerationState>("idle");
  const [candidates, setCandidates] = useState<FlashcardCandidateVM[]>([]);
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [candidateToEdit, setCandidateToEdit] = useState<FlashcardCandidateVM | null>(null);

  // Ref to store the index of the candidate being edited for potential rollback
  const editedCandidateIndex = useRef<number | null>(null);

  const generateCandidates = async (sourceText: string) => {
    setState("loading");
    setError(null);
    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_text: sourceText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || "Failed to generate candidates.");
      }

      const data: GenerationResponseDto = await response.json();

      setCandidates(data.candidates.map((c) => ({ ...c, id: crypto.randomUUID() })));
      setGenerationId(data.generation_id);
      setState("reviewing");
    } catch (e: any) {
      setError(e.message);
      setState("error");
    }
  };

  const acceptSingleCandidate = async (
    editedCandidate: FlashcardCandidateVM,
    originalCandidate: FlashcardCandidateVM
  ) => {
    if (!generationId) {
      setError("Generation ID is missing.");
      return;
    }

    const source =
      originalCandidate.front !== editedCandidate.front || originalCandidate.back !== editedCandidate.back
        ? "ai_generated_edited"
        : "ai_generated";

    const payload: CreateFlashcardCommand = {
      front: editedCandidate.front,
      back: editedCandidate.back,
      source,
      generation_id: generationId,
    };

    // Optimistic update
    editedCandidateIndex.current = candidates.findIndex((c) => c.id === originalCandidate.id);
    setCandidates((prev) => prev.filter((c) => c.id !== originalCandidate.id));
    closeEditModal();

    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || "Failed to save the flashcard.");
      }
      // On success, the candidate is already removed.
    } catch (e: any) {
      setError(e.message);
      console.error(e.message);
      // Rollback on failure
      if (editedCandidateIndex.current !== null) {
        setCandidates((prev) => {
          const newCandidates = [...prev];
          newCandidates.splice(editedCandidateIndex.current!, 0, originalCandidate);
          return newCandidates;
        });
      }
    } finally {
      editedCandidateIndex.current = null;
    }
  };

  const showAcceptAllToast = () => {
    // This is handled in the view component with sonner
  };

  const rejectCandidate = (candidateId: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    if (candidateToEdit?.id === candidateId) {
      closeEditModal();
    }
  };

  const openEditModal = (candidate: FlashcardCandidateVM) => {
    setCandidateToEdit(candidate);
  };

  const closeEditModal = () => {
    setCandidateToEdit(null);
  };

  const reset = () => {
    setState("idle");
    setCandidates([]);
    setGenerationId(null);
    setError(null);
    setCandidateToEdit(null);
  };

  return {
    state,
    candidates,
    generationId,
    error,
    candidateToEdit,
    generateCandidates,
    acceptSingleCandidate,
    showAcceptAllToast,
    rejectCandidate,
    openEditModal,
    closeEditModal,
    reset,
  };
}
