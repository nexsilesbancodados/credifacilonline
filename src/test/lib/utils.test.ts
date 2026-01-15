import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("should merge class names", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toBe("base-class active-class");
  });

  it("should filter out falsy values", () => {
    const result = cn("base", false, null, undefined, "valid");
    expect(result).toBe("base valid");
  });

  it("should merge conflicting Tailwind classes correctly", () => {
    // tailwind-merge should take the last value
    const result = cn("px-4", "px-8");
    expect(result).toBe("px-8");
  });

  it("should handle empty inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle object syntax", () => {
    const result = cn({
      "text-primary": true,
      "text-secondary": false,
    });
    expect(result).toBe("text-primary");
  });
});
