import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Menu } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SignOutButton from "./SignOutButton"; // Import SignOutButton

interface User {
  id: string;
  email?: string;
}

interface TopNavProps {
  user: User | null;
}

const TopNav: React.FC<TopNavProps> = ({ user }) => {
  const [pathname, setPathname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const sheetCloseBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    console.log("TopNav: Attempting to sign out...");
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (response.ok) {
      console.log("TopNav: Server-side logout API call successful. Redirecting to login.");
      // Close the mobile sheet if it's open
      sheetCloseBtnRef.current?.click();
      window.location.href = "/auth/login";
    } else {
      const errorData = await response.json();
      console.error("TopNav: Server-side logout API call failed:", errorData);
      toast.error(errorData.error || "Wystąpił błąd podczas wylogowywania. Spróbuj ponownie.");
      setIsLoading(false);
    }
  };

  const loggedInLinks = [
    { href: "/generate", label: "Generator" },
    { href: "/study", label: "Study" },
    { href: "/profile", label: "Profile" },
    { href: "/cards", label: "My Cards" }, // Added My Cards link
  ];

  const loggedOutLinks = [
    { href: "/auth/login", label: "Zaloguj się" },
    { href: "/auth/register", label: "Zarejestruj się" },
  ];

  return (
    <div className="border-b">
      <div className="container flex h-14 items-center px-4">
        <a href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold">Home</span>
        </a>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {user ? (
              <>
                {loggedInLinks.map((link) => (
                  <NavigationMenuItem key={link.href}>
                    <NavigationMenuLink
                      href={link.href}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        pathname === link.href && "bg-accent text-accent-foreground"
                      )}
                    >
                      {link.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </>
            ) : (
              <>
                {loggedOutLinks.map((link) => (
                  <NavigationMenuItem key={link.href}>
                    <NavigationMenuLink
                      href={link.href}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        pathname === link.href && "bg-accent text-accent-foreground"
                      )}
                    >
                      {link.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* User Info / Sign Out Button (Desktop) */}
        <div className="hidden md:flex items-center ml-auto">
          {user ? <SignOutButton onSignOut={handleSignOut} isLoading={isLoading} /> : null}
        </div>

        {/* Mobile Navigation */}
        <div className="flex-1 flex items-center justify-end md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle mobile menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 pt-6">
                {user ? (
                  <>
                    {loggedInLinks.map((link) => (
                      <NavigationMenuLink
                        key={link.href}
                        href={link.href}
                        className={cn(
                          navigationMenuTriggerStyle(),
                          "w-full justify-start",
                          pathname === link.href && "bg-accent text-accent-foreground"
                        )}
                      >
                        {link.label}
                      </NavigationMenuLink>
                    ))}
                    <div className="mt-4 pt-4 border-t">
                      <SignOutButton onSignOut={handleSignOut} isLoading={isLoading} />
                      {/* Invisible button to close the mobile sheet programmatically */}
                      <button ref={sheetCloseBtnRef} className="hidden" />
                    </div>
                  </>
                ) : (
                  <>
                    {loggedOutLinks.map((link) => (
                      <NavigationMenuLink
                        key={link.href}
                        href={link.href}
                        className={cn(
                          navigationMenuTriggerStyle(),
                          "w-full justify-start",
                          pathname === link.href && "bg-accent text-accent-foreground"
                        )}
                      >
                        {link.label}
                      </NavigationMenuLink>
                    ))}
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
