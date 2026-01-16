import React from "react";
import { Button } from "./ui/button";

interface StudyControlsProps {
  isAnswerVisible: boolean;
  onShowAnswer: () => void;
  onEvaluate: (knewIt: boolean) => void;
}

export const StudyControls: React.FC<StudyControlsProps> = ({
  isAnswerVisible,
  onShowAnswer,
  onEvaluate,
}) => {
  return (
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
};
