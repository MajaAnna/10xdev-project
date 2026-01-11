import * as React from "react";
import { Button } from "@/components/ui/button";
import type { FlashcardCandidateVM } from "./hooks/useFlashcardGenerator";
import { CandidateCard } from "./CandidateCard";
import { cn } from "@/lib/utils";

interface CandidateReviewListProps {
  candidates: FlashcardCandidateVM[];
  generationId: number | null;
  onAcceptAll: () => void;
  onOpenEditModal: (candidate: FlashcardCandidateVM) => void;
  onDeleteCandidate: (candidateId: string) => void;
  className?: string;
}

export function CandidateReviewList({
  candidates,
  onAcceptAll,
  onOpenEditModal,
  onDeleteCandidate,
  className,
}: CandidateReviewListProps) {
  if (candidates.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">All candidates have been reviewed!</h2>
        <p className="text-muted-foreground mt-2">You can generate a new set of flashcards at any time.</p>
      </div>
    );
  }
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Review Candidates ({candidates.length})</h2>
        <Button onClick={onAcceptAll}>Accept all</Button>
      </div>
      <div className="space-y-3">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onEdit={() => onOpenEditModal(candidate)}
            onDelete={() => onDeleteCandidate(candidate.id)}
          />
        ))}
      </div>
    </div>
  );
}
