import { describe, expect, it } from "vitest";
import { calculateMatchScore } from "../../../../src/services/hiring/tools/deterministicMatchingTool.js";
import { normalizeSkillsTool } from "../../../../src/services/hiring/tools/skillNormalizationTool.js";

const opening = { experienceMin: 4, experienceMax: 8, location: "New York" };

describe("hiring deterministic matching tool", () => {
  it("returns zero experience match below the minimum and full match at both boundaries", () => {
    const candidate = (experienceYears: number) => calculateMatchScore({
      features: { experienceYears, location: "New York" },
      normalizedSkills: { candidateSkills: ["typescript"], requiredSkills: ["typescript"] },
      opening,
    });

    expect(candidate(3.99).experienceMatchScore).toBe(0);
    expect(candidate(4).experienceMatchScore).toBe(1);
    expect(candidate(8).experienceMatchScore).toBe(1);
    expect(candidate(8.01).experienceMatchScore).toBe(0.8);
  });

  it("counts only normalized exact skill overlap", () => {
    const normalized = normalizeSkillsTool(["NodeJS", "React JS", "node.js"], ["Node.js", "React", "Python"]);
    expect(normalized.candidateSkills).toEqual(["node.js", "react"]);
    expect(normalized.requiredSkills).toEqual(["node.js", "react", "python"]);

    const result = calculateMatchScore({
      features: { experienceYears: 4, location: "New York" },
      normalizedSkills: normalized,
      opening,
    });
    expect(result.evidence.matchedSkills).toEqual(["node.js", "react"]);
    expect(result.evidence.missingSkills).toEqual(["python"]);
    expect(result.skillMatchScore).toBeCloseTo(2 / 3);
  });

  it("applies the required weighted score formula and recommendation threshold", () => {
    const result = calculateMatchScore({
      features: { experienceYears: 4, location: "Elsewhere" },
      normalizedSkills: { candidateSkills: ["typescript"], requiredSkills: ["typescript", "python"] },
      opening,
    });

    expect(result.skillMatchScore).toBe(0.5);
    expect(result.experienceMatchScore).toBe(1);
    expect(result.locationMatchScore).toBe(0.5);
    expect(result.finalScore).toBeCloseTo((0.5 * 0.5) + (0.3 * 1) + (0.2 * 0.5));
    expect(result.finalScore).toBe(0.65);
    expect(result.decision).toBe("BORDERLINE");
    expect(result.recommended).toBe(false);
  });

  it("gives full location credit for remote or exact case-insensitive matches", () => {
    const score = (openingLocation: string, candidateLocation: string) => calculateMatchScore({
      features: { experienceYears: 4, location: candidateLocation },
      normalizedSkills: { candidateSkills: ["x"], requiredSkills: ["x"] },
      opening: { ...opening, location: openingLocation },
    });

    expect(score("Remote", "Prayagraj").locationMatchScore).toBe(1);
    expect(score("REMOTE - US", "Prayagraj").locationMatchScore).toBe(1);
    expect(score("New York", "new york").locationMatchScore).toBe(1);
    expect(score("New York", "Boston").locationMatchScore).toBe(0.5);
  });
});
