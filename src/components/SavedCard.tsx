import type { FlashcardDto } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SavedCardProps {
  card: FlashcardDto;
  onEdit: (card: FlashcardDto) => void;
  onDelete: (card: FlashcardDto) => void;
}

const SavedCard = ({ card, onEdit, onDelete }: SavedCardProps) => {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold line-clamp-3">{card.front}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription className="line-clamp-5">{card.back}</CardDescription>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => onEdit(card)}>
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(card)}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SavedCard;
