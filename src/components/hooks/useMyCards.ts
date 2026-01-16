import { useState, useEffect, useCallback } from "react";
import type { FlashcardDto, UpdateFlashcardCommand } from "@/types";
import { getFlashcards, createFlashcard, updateFlashcard, deleteFlashcard } from "@/lib/api/flashcards";
import { toast } from "sonner";
import type { ManualCardFormValues } from "@/lib/schemas/flashcard.schemas";

export function useMyCards() {
  const [cards, setCards] = useState<FlashcardDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getFlashcards({ limit: 50 });
      setCards(response.data);
    } catch (err) {
      setError("Failed to fetch flashcards.");
      console.error(err);
      toast.error("Failed to fetch flashcards.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const addCard = async (data: ManualCardFormValues) => {
    setIsSubmitting(true);
    const tempId = Date.now();
    const newCard: FlashcardDto = {
      id: tempId,
      front: data.front,
      back: data.back,
      source: "manual",
      generation_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setCards((prev) => [newCard, ...prev]);
    toast.success("Flashcard created successfully!");

    try {
      const createdCard = await createFlashcard({
        ...data,
        source: "manual",
        generation_id: null,
      });
      setCards((prev) => prev.map((card) => (card.id === tempId ? createdCard : card)));
    } catch (err) {
      console.error(err);
      toast.error("Failed to create flashcard. Please try again.");
      setCards((prev) => prev.filter((card) => card.id !== tempId));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCard = async (id: number, data: UpdateFlashcardCommand) => {
    setIsSubmitting(true);
    const originalCards = [...cards];
    const updatedCard = cards.find((card) => card.id === id);

    if (!updatedCard) return;

    setCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, ...data, updated_at: new Date().toISOString() } : card))
    );
    toast.success("Flashcard updated successfully!");

    try {
      await updateFlashcard(id, data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update flashcard. Please try again.");
      setCards(originalCards);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCard = async (id: number) => {
    const originalCards = [...cards];
    setCards((prev) => prev.filter((card) => card.id !== id));
    toast.success("Flashcard deleted successfully!");

    try {
      await deleteFlashcard(id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete flashcard. Please try again.");
      setCards(originalCards);
    }
  };

  return { cards, isLoading, isSubmitting, error, addCard, updateCard, deleteCard, fetchCards };
}
