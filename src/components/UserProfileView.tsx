import React, { useEffect, useState } from "react";
// import { useRouter } from "astro:router"; // Usunięto import useRouter
import { supabaseClient } from "../db/supabase.client"; // Poprawiono import
import { type UserProfileViewModel } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import UserProfileDisplay from "./UserProfileDisplay";
import SignOutButton from "./SignOutButton";
import { toast } from "sonner";
import { countFlashcardsForUser } from "../lib/services/flashcard.service";

const UserProfileView: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfileViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const router = useRouter(); // Usunięto inicjalizację routera

  useEffect(() => {
    const fetchUserProfile = async () => {
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser(); // Użyto supabaseClient.auth

      if (error) {
        setError("Błąd podczas pobierania profilu użytkownika.");
        setIsLoading(false);
        // Redirect to login if not authenticated
        return;
      }

      if (user) {
        // Format join date nicely
        const joinDate = new Date(user.created_at).toLocaleDateString("pl-PL", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const numberOfCards = await countFlashcardsForUser(supabaseClient, user.id);

        setUserProfile({
          email: user.email || "N/A",
          joinDate: joinDate,
          numberOfCards: numberOfCards,
        });
      } else {
        // No user session. The middleware should handle redirection if unauthenticated.
        // Display a generic message or handle through conditional rendering if userProfile remains null.
      }
      setIsLoading(false);
    };

    fetchUserProfile();
  }, []); // Usunięto [router] z zależności useEffect

  const handleSignOut = async () => {
    setIsLoading(true);
    const { error } = await supabaseClient.auth.signOut(); // Użyto supabaseClient.auth

    if (error) {
      setError("Błąd podczas wylogowywania.");
      toast.error("Wystąpił błąd podczas wylogowywania. Spróbuj ponownie.");
      setIsLoading(false);
    } else {
      window.location.href = "/auth/login"; // Zastąpiono router.push
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Błąd</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!userProfile) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Brak Danych Profilu</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Nie udało się załadować danych profilu użytkownika.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Profil Użytkownika</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <UserProfileDisplay userProfile={userProfile} />
        <SignOutButton onSignOut={handleSignOut} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
};

export default UserProfileView;
