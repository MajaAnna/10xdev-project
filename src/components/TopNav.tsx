import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

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
          <span className="font-bold">AI Cards</span>
        </a>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex flex-1">
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
        <div className="hidden md:flex items-center justify-end space-x-4">
          {user ? (
            <>
              <span className="text-sm font-medium">{user.email}</span>
              <SignOutButton />
            </>
          ) : null}
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
                      <span className="block text-sm font-medium mb-2">{user.email}</span>
                      <SignOutButton />
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
