import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { FlashcardDto } from "../types"; // Changed from Flashcard to FlashcardDto

interface FlashcardViewerProps {
  card: FlashcardDto; // Changed prop name to 'card'
  isAnswerVisible: boolean;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({
  card, // Changed prop name to 'card'
  isAnswerVisible,
}) => {
  return (
    <Card className="w-full max-w-lg mx-auto min-h-[200px] flex flex-col justify-between">
      <CardHeader>
        <CardTitle>{isAnswerVisible ? "Answer" : "Question"}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center">
        <p className="text-xl text-center">{isAnswerVisible ? card.back : card.front}</p>
      </CardContent>
    </Card>
  );
};
