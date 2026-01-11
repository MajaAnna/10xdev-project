import { useFlashcardGenerator } from "./hooks/useFlashcardGenerator";

export default function FlashcardsGeneratorView() {
  const {
    state,
    candidates,
    error,
    candidateToEdit,
    generateCandidates,
    acceptSingleCandidate,
    showAcceptAllToast,
    rejectCandidate,
    openEditModal,
    closeEditModal,
  } = useFlashcardGenerator();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Flashcards Generator</h1>

      {state === "idle" && (
        <div>
          {/* GenerationForm will be here */}
          <p>State: idle. GenerationForm will be here.</p>
        </div>
      )}

      {state === "loading" && (
        <div>
          {/* Spinner will be here */}
          <p>State: loading. Spinner will be here.</p>
        </div>
      )}

      {state === "reviewing" && (
        <div>
          {/* CandidateReviewList will be here */}
          <p>State: reviewing. CandidateReviewList will be here.</p>
          <pre>{JSON.stringify(candidates, null, 2)}</pre>
        </div>
      )}

      {state === "error" && (
        <div>
          <p>State: error.</p>
          <p>{error}</p>
        </div>
      )}

      {candidateToEdit && (
        <div>
          {/* EditCandidateModal will be here */}
          <p>Editing candidate: {candidateToEdit.id}</p>
        </div>
      )}
    </div>
  );
}
