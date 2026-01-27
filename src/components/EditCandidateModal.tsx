import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { FlashcardCandidateVM } from "./hooks/useFlashcardGenerator";
import { cn } from "@/lib/utils";

interface EditCandidateModalProps {
  isOpen: boolean;
  candidate: FlashcardCandidateVM | null;
  onSave: (editedCandidate: FlashcardCandidateVM) => void;
  onReject: (candidateId: string) => void;
  onCancel: () => void;
}

const FRONT_MIN_LENGTH = 1;
const FRONT_MAX_LENGTH = 200;
const BACK_MIN_LENGTH = 1;
const BACK_MAX_LENGTH = 500;

export function EditCandidateModal({ isOpen, candidate, onSave, onReject, onCancel }: EditCandidateModalProps) {
  const [editedFront, setEditedFront] = React.useState("");
  const [editedBack, setEditedBack] = React.useState("");

  React.useEffect(() => {
    if (candidate) {
      setEditedFront(candidate.front);
      setEditedBack(candidate.back);
    }
  }, [candidate]);

  if (!candidate) return null;

  const isFrontValid = editedFront.length >= FRONT_MIN_LENGTH && editedFront.length <= FRONT_MAX_LENGTH;
  const isBackValid = editedBack.length >= BACK_MIN_LENGTH && editedBack.length <= BACK_MAX_LENGTH;
  const isFormValid = isFrontValid && isBackValid;

  const handleSave = () => {
    if (!isFormValid) return;
    const editedCandidate = { ...candidate, front: editedFront, back: editedBack };
    onSave(editedCandidate);
  };

  const handleReject = () => {
    onReject(candidate.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Candidate</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="front">Front</label>
            <Textarea
              id="front"
              value={editedFront}
              onChange={(e) => setEditedFront(e.target.value)}
              className={cn(!isFrontValid && "border-red-500")}
            />
            <p className="text-sm text-muted-foreground">
              {editedFront.length} / {FRONT_MAX_LENGTH}
            </p>
          </div>
          <div className="grid gap-2">
            <label htmlFor="back">Back</label>
            <Textarea
              id="back"
              value={editedBack}
              onChange={(e) => setEditedBack(e.target.value)}
              className={cn(!isBackValid && "border-red-500")}
            />
            <p className="text-sm text-muted-foreground">
              {editedBack.length} / {BACK_MAX_LENGTH}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="destructive" onClick={handleReject}>
            Reject
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!isFormValid}>
            Save and accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
