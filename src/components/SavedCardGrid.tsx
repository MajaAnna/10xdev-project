import type { FlashcardDto } from "@/types";
import SavedCard from "./SavedCard";

interface SavedCardGridProps {
  cards: FlashcardDto[];
  onEdit: (card: FlashcardDto) => void;
  onDelete: (card: FlashcardDto) => void;
}

const EmptyState = () => (
  <div className="text-center py-16 px-6 border-2 border-dashed rounded-lg">
    <h3 className="text-xl font-semibold">No Flashcards Yet</h3>
    <p className="text-muted-foreground mt-2">Click &quot;Add New Card&quot; to create your first flashcard.</p>
  </div>
);

const SavedCardGrid = ({ cards, onEdit, onDelete }: SavedCardGridProps) => {
  if (cards.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <SavedCard key={card.id} card={card} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default SavedCardGrid;
