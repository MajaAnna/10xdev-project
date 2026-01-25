import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Logged out successfully!");
        // Redirect to login page after successful logout
        window.location.href = "/auth/login";
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to log out.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An unexpected error occurred during logout.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleSignOut} disabled={isLoading} variant="ghost">
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Wyloguj się
    </Button>
  );
}
