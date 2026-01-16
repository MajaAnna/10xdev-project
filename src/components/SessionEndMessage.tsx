import React from "react";
import { Button } from "./ui/button";

interface SessionEndMessageProps {
  onRestart: () => void;
  onGoToGenerator: () => void;
}

export const SessionEndMessage: React.FC<SessionEndMessageProps> = ({
  onRestart,
  onGoToGenerator,
}) => {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h2 className="text-2xl font-bold">Study Session Complete!</h2>
      <p>You have reviewed all the cards.</p>
      <div className="flex gap-4">
        <Button onClick={onRestart}>Restart Session</Button>
        <Button variant="outline" onClick={onGoToGenerator}>
          Return to Generator
        </Button>
      </div>
    </div>
  );
};

