import { describe, it, expect } from "vitest";
import { calculateMD5Hash } from "@/lib/utils/hash.utils";

describe("hash.utils", () => {
  describe("calculateMD5Hash", () => {
    it("should generate MD5 hash for given text", () => {
      const text = "Hello, world!";
      const hash = calculateMD5Hash(text);

      expect(hash).toBeDefined();
      expect(hash).toBe("6cd3556deb0da54bca060b4c39479839");
      expect(hash.length).toBe(32); // MD5 hash is always 32 characters
    });

    it("should generate different hashes for different texts", () => {
      const text1 = "Hello, world!";
      const text2 = "Hello, World!"; // Different case

      const hash1 = calculateMD5Hash(text1);
      const hash2 = calculateMD5Hash(text2);

      expect(hash1).not.toBe(hash2);
    });

    it("should generate same hash for same text", () => {
      const text = "Consistent text";

      const hash1 = calculateMD5Hash(text);
      const hash2 = calculateMD5Hash(text);

      expect(hash1).toBe(hash2);
    });

    it("should handle empty string", () => {
      const hash = calculateMD5Hash("");

      expect(hash).toBeDefined();
      expect(hash).toBe("d41d8cd98f00b204e9800998ecf8427e"); // MD5 of empty string
      expect(hash.length).toBe(32);
    });

    it("should handle special characters", () => {
      const text = "Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?";
      const hash = calculateMD5Hash(text);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(32);
    });

    it("should handle unicode characters", () => {
      const text = "Unicode: 你好世界 🌍 émojis";
      const hash = calculateMD5Hash(text);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(32);
    });

    it("should handle very long text", () => {
      const text = "a".repeat(10000);
      const hash = calculateMD5Hash(text);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(32);
    });

    it("should handle text with newlines and whitespace", () => {
      const text = "Line 1\nLine 2\r\nLine 3\t\tTabbed";
      const hash = calculateMD5Hash(text);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(32);
    });

    it("should be case-sensitive", () => {
      const lowercase = "test";
      const uppercase = "TEST";

      const hash1 = calculateMD5Hash(lowercase);
      const hash2 = calculateMD5Hash(uppercase);

      expect(hash1).not.toBe(hash2);
    });

    it("should produce hexadecimal output", () => {
      const text = "Test text";
      const hash = calculateMD5Hash(text);

      // Check if hash contains only hexadecimal characters (0-9, a-f)
      expect(hash).toMatch(/^[0-9a-f]{32}$/);
    });
  });
});

