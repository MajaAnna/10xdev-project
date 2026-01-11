import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface GenerationFormProps {
  isLoading: boolean;
  onSubmit: (sourceText: string) => void;
  className?: string;
}

const MIN_LENGTH = 100;
const MAX_LENGTH = 10000;

export function GenerationForm({ isLoading, onSubmit, className }: GenerationFormProps) {
  const [sourceText, setSourceText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const charCount = sourceText.length;
  const isValid = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH;

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setSourceText(text);
    if (text.length > 0 && (text.length < MIN_LENGTH || text.length > MAX_LENGTH)) {
      setError(`Text must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`);
    } else {
      setError(null);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isValid && !isLoading) {
      onSubmit(sourceText);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("grid w-full gap-4", className)}>
      <div className="relative">
        <Textarea
          placeholder="Paste your text here to generate flashcards (100-10,000 characters)..."
          value={sourceText}
          onChange={handleTextChange}
          disabled={isLoading}
          className="resize-y min-h-[200px] pr-20"
        />
        <div
          className={cn(
            "absolute bottom-2 right-2 text-xs",
            charCount > MAX_LENGTH || (charCount > 0 && charCount < MIN_LENGTH)
              ? "text-red-500"
              : "text-muted-foreground"
          )}
        >
          {charCount} / {MAX_LENGTH}
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={!isValid || isLoading}>
        {isLoading ? "Generating..." : "Generate"}
      </Button>
    </form>
  );
}
