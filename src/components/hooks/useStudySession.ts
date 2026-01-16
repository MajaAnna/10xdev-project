import { useState, useEffect, useCallback } from "react";
import type { FlashcardDto, ListFlashcardsResponseDto } from "@/types";

// Helper function to shuffle an array
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export interface UseStudySessionReturn {
  status: "loading" | "error" | "ready" | "finished";
  error: string | null;
  currentCard?: FlashcardDto;
  isAnswerVisible: boolean;
  progress: {
    current: number;
    total: number;
  };
  actions: {
    showAnswer: () => void;
    evaluateCard: (knewIt: boolean) => void;
    restartSession: () => void;
  };
}

export const useStudySession = (): UseStudySessionReturn => {
  const [status, setStatus] = useState<"loading" | "error" | "ready" | "finished">("loading");
  const [error, setError] = useState<string | null>(null);
  const [allCards, setAllCards] = useState<FlashcardDto[]>([]);
  const [studyQueue, setStudyQueue] = useState<FlashcardDto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);

  const fetchFlashcards = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/flashcards");
      if (!response.ok) {
        throw new Error("Failed to fetch flashcards.");
      }
      const data: ListFlashcardsResponseDto = await response.json();
      setAllCards(data.data);
      setStudyQueue(shuffleArray(data.data));
      setCurrentIndex(0);
      setStatus("ready");
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(errorMessage);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  const showAnswer = () => {
    setIsAnswerVisible(true);
  };

  const evaluateCard = () => {
    if (currentIndex < studyQueue.length - 1) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
      setIsAnswerVisible(false);
    } else {
      setStatus("finished");
    }
  };

  const restartSession = () => {
    setStudyQueue(shuffleArray(allCards));
    setCurrentIndex(0);
    setIsAnswerVisible(false);
    setStatus("ready");
  };

  const currentCard = studyQueue[currentIndex];

  return {
    status,
    error,
    currentCard,
    isAnswerVisible,
    progress: {
      current: status === "finished" ? studyQueue.length : currentIndex + 1,
      total: studyQueue.length,
    },
    actions: {
      showAnswer,
      evaluateCard,
      restartSession,
    },
  };
};
