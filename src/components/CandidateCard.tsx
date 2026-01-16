import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Check } from "lucide-react"; // Import Check icon
import { cn } from "@/lib/utils";
import type { FlashcardCandidateVM } from "./hooks/useFlashcardGenerator";

interface CandidateCardProps {
  candidate: FlashcardCandidateVM;
  onEdit: () => void;
  onDelete: () => void;
  onAccept: () => void; // Added onAccept prop
  className?: string;
}

export function CandidateCard({ candidate, onEdit, onDelete, onAccept, className }: CandidateCardProps) {
  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent onEdit from being triggered
    onDelete();
  };

  const handleAcceptClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent onEdit from being triggered
    onAccept();
  };

  return (
    <Card className={cn("cursor-pointer hover:bg-muted/50 transition-colors", className)} onClick={onEdit}>
      <CardContent className="p-4 flex justify-between items-start gap-4">
        <div className="flex-1 grid grid-cols-2 gap-4">
          <p className="font-semibold">{candidate.front}</p>
          <p>{candidate.back}</p>
        </div>
        <div className="flex gap-1">
          {" "}
          {/* Group buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="text-green-500 hover:text-green-600" // Green color for accept
            onClick={handleAcceptClick}
            aria-label="Accept candidate"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleDeleteClick}
            aria-label="Delete candidate"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
