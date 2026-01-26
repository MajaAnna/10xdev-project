import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("utils", () => {
  describe("cn (className utility)", () => {
    it("should merge single className", () => {
      const result = cn("text-red-500");
      expect(result).toBe("text-red-500");
    });

    it("should merge multiple classNames", () => {
      const result = cn("text-red-500", "bg-blue-500");
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should handle conditional classNames", () => {
      const isActive = true;
      const result = cn("base-class", isActive && "active-class");
      expect(result).toBe("base-class active-class");
    });

    it("should filter out false/null/undefined values", () => {
      // eslint-disable-next-line no-constant-binary-expression
      const result = cn("base-class", false && "false-class", null, undefined, "valid-class");
      expect(result).toBe("base-class valid-class");
    });

    it("should merge Tailwind conflicting classes correctly", () => {
      // twMerge should keep the last conflicting class
      const result = cn("px-2", "px-4");
      expect(result).toBe("px-4");
    });

    it("should handle array of classNames", () => {
      const result = cn(["text-red-500", "bg-blue-500"]);
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should handle object with boolean values", () => {
      const result = cn({
        "text-red-500": true,
        "bg-blue-500": false,
        "font-bold": true,
      });
      expect(result).toBe("text-red-500 font-bold");
    });

    it("should handle empty input", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("should handle complex nested conditions", () => {
      const isActive = true;
      const isDisabled = false;
      const variant = "primary";

      const result = cn(
        "base-class",
        isActive && "active",
        isDisabled && "disabled",
        variant === "primary" && "primary-variant"
      );

      expect(result).toBe("base-class active primary-variant");
    });

    it("should deduplicate identical classes", () => {
      const result = cn("text-red-500", "text-red-500", "bg-blue-500");
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should handle Tailwind modifiers correctly", () => {
      const result = cn("hover:text-red-500", "focus:text-blue-500");
      expect(result).toBe("hover:text-red-500 focus:text-blue-500");
    });

    it("should merge responsive classes correctly", () => {
      const result = cn("text-sm", "md:text-base", "lg:text-lg");
      expect(result).toBe("text-sm md:text-base lg:text-lg");
    });

    it("should handle dark mode classes", () => {
      const result = cn("text-black", "dark:text-white");
      expect(result).toBe("text-black dark:text-white");
    });
  });
});
