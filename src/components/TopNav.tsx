import React, { useEffect, useState } from "react";
// import { usePathname } from "astro/components"; // Usunięto import usePathname
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

const TopNav: React.FC = () => {
  const [pathname, setPathname] = useState(""); // Używamy stanu do przechowywania pathname

  useEffect(() => {
    setPathname(window.location.pathname); // Pobieramy pathname po zamontowaniu komponentu
  }, []);

  const links = [
    { href: "/generate", label: "Generator" },
    { href: "/cards", label: "Moje Fiszki" },
    { href: "/study", label: "Ucz się" },
    { href: "/profile", label: "Profil" },
  ];

  return (
    <div className="border-b">
      <div className="container flex h-14 items-center px-4">
        <a href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold">AI Cards</span>
        </a>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {links.map((link) => (
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
          </NavigationMenuList>
        </NavigationMenu>

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
                {links.map((link) => (
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
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Placeholder for future user icon/dropdown if needed (desktop) */}
        <div className="hidden md:flex flex-1 items-center justify-end space-x-4">
          {/* Add a user icon or similar here */}
        </div>
      </div>
    </div>
  );
};

export default TopNav;
