import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlashcardCandidateVM } from "./hooks/useFlashcardGenerator";

interface CandidateCardProps {
  candidate: FlashcardCandidateVM;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

export function CandidateCard({ candidate, onEdit, onDelete, className }: CandidateCardProps) {
  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent onEdit from being triggered
    onDelete();
  };

  return (
    <Card className={cn("cursor-pointer hover:bg-muted/50 transition-colors", className)} onClick={onEdit}>
      <CardContent className="p-4 flex justify-between items-start gap-4">
        <div className="flex-1 grid grid-cols-2 gap-4">
          <p className="font-semibold">{candidate.front}</p>
          <p>{candidate.back}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          onClick={handleDeleteClick}
          aria-label="Delete candidate"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
