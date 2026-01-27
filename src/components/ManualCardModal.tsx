"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ManualCardFormValues } from "@/lib/schemas/flashcard.schemas";
import { manualCardFormSchema } from "@/lib/schemas/flashcard.schemas";

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

interface ManualCardModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: ManualCardFormValues) => void;
  isSubmitting: boolean;
}

export function ManualCardModal({ isOpen, onOpenChange, onSubmit, isSubmitting }: ManualCardModalProps) {
  const form = useForm<ManualCardFormValues>({
    resolver: zodResolver(manualCardFormSchema),
    defaultValues: {
      front: "",
      back: "",
    },
  });

  const {
    handleSubmit,
    control,
    watch,
    formState: { isValid },
  } = form;

  const frontValue = watch("front");
  const backValue = watch("back");

  const handleFormSubmit = (data: ManualCardFormValues) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Flashcard</DialogTitle>
          <DialogDescription>Manually add a new flashcard to your collection.</DialogDescription>
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
                    <Input placeholder="e.g., What is the capital of Poland?" {...field} />
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
                    <Textarea placeholder="e.g., Warsaw" className="resize-none" {...field} />
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
                {isSubmitting ? "Saving..." : "Save Flashcard"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
