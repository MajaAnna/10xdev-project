"use client";

import React from "react";
import { useStudySession } from "@/components/hooks/useStudySession";
import type { FlashcardDto } from "@/types";
import { Button } from "@/components/ui/button";

// Placeholder components - will be implemented in the next steps
const Spinner = () => <div>Loading...</div>;
const Alert = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-md border border-red-400 bg-red-50 p-4 text-red-700">{children}</div>
);
const SessionEndMessage = ({ onRestart }: { onRestart: () => void }) => (
  <div className="flex flex-col items-center gap-4">
    <h2 className="text-2xl font-bold">Session Complete!</h2>
    <p>You have reviewed all the cards.</p>
    <div className="flex gap-4">
      <Button onClick={onRestart}>Restart Session</Button>
      <Button variant="outline" asChild>
        <a href="/generate">Return to Generator</a>
      </Button>
    </div>
  </div>
);
const StudyProgressBar = ({ current, total }: { current: number; total: number }) => (
  <div className="w-full text-center text-sm text-muted-foreground">
    Card {current} / {total}
  </div>
);
const FlashcardViewer = ({ card, isAnswerVisible }: { card: FlashcardDto; isAnswerVisible: boolean }) => (
  <div className="min-h-64 w-full rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm">
    <h3 className="text-xl font-semibold">{card.front}</h3>
    {isAnswerVisible && (
      <div className="mt-4 border-t pt-4">
        <p>{card.back}</p>
      </div>
    )}
  </div>
);
const StudyControls = ({
  onShowAnswer,
  onEvaluate,
  isAnswerVisible,
}: {
  onShowAnswer: () => void;
  onEvaluate: (knew: boolean) => void;
  isAnswerVisible: boolean;
}) => (
  <div className="flex w-full justify-center gap-4">
    {!isAnswerVisible ? (
      <Button onClick={onShowAnswer} className="w-48">
        Show Answer
      </Button>
    ) : (
      <>
        <Button variant="outline" className="w-48" onClick={() => onEvaluate(false)}>
          Don&apos;t Know
        </Button>
        <Button className="w-48" onClick={() => onEvaluate(true)}>
          Know
        </Button>
      </>
    )}
  </div>
);

const StudyView = () => {
  const { status, error, currentCard, isAnswerVisible, progress, actions } = useStudySession();

  if (status === "loading") {
    return <Spinner />;
  }

  if (status === "error") {
    return <Alert>{error || "An unknown error occurred."}</Alert>;
  }

  if (status === "ready" && progress.total === 0) {
    return (
      <Alert>
        You have no cards to study.{" "}
        <a href="/generate" className="underline">
          Create some first!
        </a>
      </Alert>
    );
  }

  if (status === "finished") {
    return <SessionEndMessage onRestart={actions.restartSession} />;
  }

  if (status === "ready" && currentCard) {
    return (
      <div className="flex w-full max-w-2xl flex-col items-center gap-8">
        <StudyProgressBar current={progress.current} total={progress.total} />
        <FlashcardViewer card={currentCard} isAnswerVisible={isAnswerVisible} />
        <StudyControls
          isAnswerVisible={isAnswerVisible}
          onShowAnswer={actions.showAnswer}
          onEvaluate={actions.evaluateCard}
        />
      </div>
    );
  }

  return <Alert>Something went wrong.</Alert>;
};

export default StudyView;
