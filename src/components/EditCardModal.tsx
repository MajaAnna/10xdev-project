"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UpdateFlashcardDto } from "@/lib/schemas/flashcard.schemas";
import { UpdateFlashcardSchema } from "@/lib/schemas/flashcard.schemas";
import type { FlashcardDto } from "@/types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface EditCardModalProps {
  card: FlashcardDto | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (id: number, data: UpdateFlashcardDto) => void;
  isSubmitting: boolean;
}

export function EditCardModal({ card, isOpen, onOpenChange, onSubmit, isSubmitting }: EditCardModalProps) {
  const form = useForm<UpdateFlashcardDto>({
    resolver: zodResolver(UpdateFlashcardSchema),
    defaultValues: {
      front: card?.front ?? "",
      back: card?.back ?? "",
    },
  });

  const {
    handleSubmit,
    control,
    watch,
    reset,
    formState: { isValid },
  } = form;

  useEffect(() => {
    if (card) {
      reset({
        front: card.front,
        back: card.back,
      });
    }
  }, [card, reset]);

  const frontValue = watch("front") ?? "";
  const backValue = watch("back") ?? "";

  const handleFormSubmit = (data: UpdateFlashcardDto) => {
    if (card) {
      onSubmit(card.id, data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
          <DialogDescription>Make changes to your flashcard.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Front</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground self-end">{frontValue.length} / 200</span>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="back"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Back</FormLabel>
                  <FormControl>
                    <Textarea className="resize-none" {...field} />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground self-end">{backValue.length} / 500</span>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
