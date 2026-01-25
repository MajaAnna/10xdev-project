import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SignOutButtonProps {
  onSignOut: () => Promise<void>;
  isLoading: boolean;
}

export default function SignOutButton({ onSignOut, isLoading }: SignOutButtonProps) {
  return (
    <Button onClick={onSignOut} disabled={isLoading} variant="ghost">
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Log out
    </Button>
  );
}
