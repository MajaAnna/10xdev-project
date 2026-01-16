"use client";

import React from "react";
import { useStudySession } from "@/components/hooks/useStudySession";
// Import actual components
import { SessionEndMessage } from "@/components/SessionEndMessage";
import { StudyProgressBar } from "@/components/StudyProgressBar";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { StudyControls } from "@/components/StudyControls";
import { Spinner } from "@/components/ui/spinner"; // Assuming a Spinner component in ui
import { Alert } from "@/components/ui/alert"; // Assuming an Alert component in ui

const StudyView = () => {
  const { status, error, currentCard, isAnswerVisible, progress, actions } = useStudySession();

  // Helper for navigation
  const goToGenerator = () => {
    window.location.href = "/generate";
  };

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
    return <SessionEndMessage onRestart={actions.restartSession} onGoToGenerator={goToGenerator} />;
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
