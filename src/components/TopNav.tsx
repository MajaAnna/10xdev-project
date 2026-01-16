// src/components/TopNav.tsx
import React from "react";
import { usePathname } from "astro/components"; // Changed from astro:router to astro/components as per Astro 4/5 usage
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils"; // Assuming cn utility exists for conditional classnames

const TopNav: React.FC = () => {
  const pathname = usePathname();

  const links = [
    { href: "/generate", label: "Generator" },
    { href: "/cards", label: "Moje Fiszki" },
    { href: "/study", label: "Ucz się" },
    { href: "/profile", label: "Profil" }, // Link to the new profile page
  ];

  return (
    <div className="border-b">
      <div className="container flex h-14 items-center px-4">
        <a href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold">AI Cards</span>
        </a>
        <NavigationMenu>
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
        {/* Placeholder for future user icon/dropdown if needed */}
        <div className="flex-1 flex items-center justify-end space-x-4">
          {/* Add a user icon or similar here */}
        </div>
      </div>
    </div>
  );
};

export default TopNav;
