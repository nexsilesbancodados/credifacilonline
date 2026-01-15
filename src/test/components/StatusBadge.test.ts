import { describe, it, expect } from "vitest";

// Test status styling logic
describe("Status Badge Styling", () => {
  const statusStyles = {
    Ativo: "bg-success/20 text-success border-success/30",
    Atraso: "bg-destructive/20 text-destructive border-destructive/30",
    Quitado: "bg-accent/20 text-accent border-accent/30",
  };

  const getStatusStyle = (status: string) => {
    return statusStyles[status as keyof typeof statusStyles] || statusStyles.Ativo;
  };

  it("should return correct style for Ativo status", () => {
    const style = getStatusStyle("Ativo");
    expect(style).toContain("bg-success");
    expect(style).toContain("text-success");
  });

  it("should return correct style for Atraso status", () => {
    const style = getStatusStyle("Atraso");
    expect(style).toContain("bg-destructive");
    expect(style).toContain("text-destructive");
  });

  it("should return correct style for Quitado status", () => {
    const style = getStatusStyle("Quitado");
    expect(style).toContain("bg-accent");
    expect(style).toContain("text-accent");
  });

  it("should fallback to Ativo style for unknown status", () => {
    const style = getStatusStyle("Unknown");
    expect(style).toBe(statusStyles.Ativo);
  });
});
