// src/components/SignOutButton.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface SignOutButtonProps {
  onSignOut: () => void;
  isLoading: boolean;
}

const SignOutButton: React.FC<SignOutButtonProps> = ({ onSignOut, isLoading }) => {
  return (
    <Button onClick={onSignOut} disabled={isLoading} className="w-full">
      {isLoading ? <Spinner size="small" /> : "Wyloguj się"}
    </Button>
  );
};

export default SignOutButton;
