import { useState } from "react";
import type { FlashcardCandidateDto } from "@/types";

export interface FlashcardCandidateVM {
  id: string;
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

  const generateCandidates = async (sourceText: string) => {
    // Logic for POST /api/generations will be here
    console.log("Generating candidates for:", sourceText);
  };

  const acceptSingleCandidate = async (
    editedCandidate: FlashcardCandidateVM,
    originalCandidate: FlashcardCandidateVM
  ) => {
    // Logic for POST /api/flashcards will be here
    console.log("Accepting single candidate:", editedCandidate, originalCandidate);
  };

  const showAcceptAllToast = () => {
    // Logic for showing a toast will be here
    console.log("Show accept all toast");
  };

  const rejectCandidate = (candidateId: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    console.log("Rejecting candidate:", candidateId);
  };

  const openEditModal = (candidate: FlashcardCandidateVM) => {
    setCandidateToEdit(candidate);
  };

  const closeEditModal = () => {
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
  };
}
