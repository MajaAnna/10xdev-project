"use client";

import React, { useState } from "react";
import { useMyCards } from "./hooks/useMyCards";
import { Button } from "./ui/button";
import SavedCardGrid from "./SavedCardGrid";
import { Spinner } from "./ui/spinner";
import { ManualCardModal } from "./ManualCardModal";
import { Toaster } from "./ui/sonner";
import type { FlashcardDto } from "@/types";
import { EditCardModal } from "@/components/EditCardModal";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

import { type ManualCardFormValues } from "@/lib/schemas/flashcard.schemas";
import { type UpdateFlashcardCommand } from "@/types";

const MyCardsView = () => {
  const { cards, isLoading, error, addCard, updateCard, deleteCard, isSubmitting } = useMyCards();
  const [isManualModalOpen, setManualModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<FlashcardDto | null>(null);
  const [cardToDelete, setCardToDelete] = useState<FlashcardDto | null>(null);

  const handleAddCard = () => {
    setManualModalOpen(true);
  };

  const handleEditCard = (card: FlashcardDto) => {
    setCardToEdit(card);
  };

  const handleDeleteCard = (card: FlashcardDto) => {
    setCardToDelete(card);
  };

  const handleAddSubmit = (data: ManualCardFormValues) => {
    addCard(data);
    setManualModalOpen(false);
  };

  const handleEditSubmit = (id: number, data: UpdateFlashcardCommand) => {
    updateCard(id, data);
    setCardToEdit(null);
  };

  const handleDeleteConfirm = (id: number) => {
    deleteCard(id);
    setCardToDelete(null);
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">My Cards</h1>
          <p className="text-muted-foreground mt-1">Browse, create, and manage your flashcards.</p>
        </div>
        <Button onClick={handleAddCard}>Add New Card</Button>
      </div>

      <p className="text-sm text-muted-foreground mb-6">Showing the 50 newest flashcards.</p>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center h-64 bg-red-50 dark:bg-red-900/10 rounded-lg">
          <p className="text-red-600 dark:text-red-400 font-medium">Error loading cards</p>
          <p className="text-muted-foreground mt-2 text-center">{error} Please try refreshing the page.</p>
        </div>
      )}

      {!isLoading && !error && cards.length === 0 && (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">No flashcards existing yet</p>
        </div>
      )}

      {!isLoading && !error && cards.length > 0 && (
        <SavedCardGrid cards={cards} onEdit={handleEditCard} onDelete={handleDeleteCard} />
      )}

      <ManualCardModal
        isOpen={isManualModalOpen}
        onOpenChange={setManualModalOpen}
        onSubmit={handleAddSubmit}
        isSubmitting={isSubmitting}
      />

      <EditCardModal
        card={cardToEdit}
        isOpen={!!cardToEdit}
        onOpenChange={(isOpen) => !isOpen && setCardToEdit(null)}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmationDialog
        card={cardToDelete}
        isOpen={!!cardToDelete}
        onOpenChange={(isOpen) => !isOpen && setCardToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
      <Toaster />
    </div>
  );
};

export default MyCardsView;
