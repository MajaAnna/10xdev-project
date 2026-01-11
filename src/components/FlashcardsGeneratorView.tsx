"use client";

import { Toaster, toast } from "sonner";
import { GenerationForm } from "./GenerationForm";
import { CandidateReviewList } from "./CandidateReviewList";
import { EditCandidateModal } from "./EditCandidateModal";
import { Spinner } from "./ui/spinner";
import { Button } from "./ui/button";
import { useFlashcardGenerator, type FlashcardCandidateVM } from "./hooks/useFlashcardGenerator";

export default function FlashcardsGeneratorView() {
  const {
    state,
    candidates,
    error,
    candidateToEdit,
    generateCandidates,
    acceptSingleCandidate,
    rejectCandidate,
    openEditModal,
    closeEditModal,
    reset,
  } = useFlashcardGenerator();

  const showAcceptAllToast = () => {
    toast.info("Bulk save functionality will be implemented in the future.");
  };

  const handleSaveAndAccept = async (editedCandidate: FlashcardCandidateVM) => {
    if (!candidateToEdit) {
      toast.error("Failed to save: no candidate was being edited.");
      return;
    }
    // The hook now handles optimistic updates and rollbacks
    await acceptSingleCandidate(editedCandidate, candidateToEdit);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Flashcard accepted and saved!");
    }
  };

  const handleReject = (candidateId: string) => {
    rejectCandidate(candidateId);
    toast.error("Candidate rejected.");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Toaster richColors />
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Flashcards Generator</h1>
        <p className="text-muted-foreground mt-2">Let AI create flashcards from your notes in seconds.</p>
      </div>

      {state === "idle" && <GenerationForm isLoading={false} onSubmit={generateCandidates} />}

      {state === "loading" && (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <Spinner size="lg" />
          <p className="text-muted-foreground">Generating candidates...</p>
        </div>
      )}

      {state === "reviewing" && (
        <CandidateReviewList
          candidates={candidates}
          generationId={null} // generationId is not used in MVP for this component
          onAcceptAll={showAcceptAllToast}
          onOpenEditModal={openEditModal}
          onDeleteCandidate={handleReject}
        />
      )}

      {state === "error" && (
        <div className="text-center py-12 text-red-500">
          <h2 className="text-xl font-semibold">An Error Occurred</h2>
          <p className="mt-2 mb-4">{error}</p>
          <Button onClick={reset}>Try Again</Button>
        </div>
      )}

      <EditCandidateModal
        isOpen={!!candidateToEdit}
        candidate={candidateToEdit}
        onSave={handleSaveAndAccept}
        onReject={handleReject}
        onCancel={closeEditModal}
      />
    </div>
  );
}
