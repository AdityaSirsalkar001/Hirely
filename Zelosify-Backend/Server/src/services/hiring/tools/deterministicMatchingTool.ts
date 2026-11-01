export type CandidateMatchingFeatures = {
  experienceYears: number;
  location: string;
};

export type NormalizedSkillSet = {
  candidateSkills: string[];
  requiredSkills: string[];
};

export type MatchingOpening = {
  experienceMin: number;
  experienceMax: number | null;
  location: string | null;
};

/** Deterministic score tool invoked by the recommendation agent. */
export function calculateMatchScore({
  features,
  normalizedSkills,
  opening,
}: {
  features: CandidateMatchingFeatures;
  normalizedSkills: NormalizedSkillSet;
  opening: MatchingOpening;
}) {
  const requiredSkills = normalizedSkills.requiredSkills;
  const candidateSkills = normalizedSkills.candidateSkills;
  const matchedSkills = requiredSkills.filter((skill) => candidateSkills.includes(skill));
  const missingSkills = requiredSkills.filter((skill) => !candidateSkills.includes(skill));
  const skillMatchScore = requiredSkills.length ? matchedSkills.length / requiredSkills.length : 0;

  const experienceMin = Number(opening.experienceMin ?? 0);
  const experienceMax = opening.experienceMax == null ? null : Number(opening.experienceMax);
  const experienceYears = Number(features.experienceYears);
  const experienceMatchScore = experienceYears < experienceMin
    ? 0
    : experienceMax === null || experienceYears <= experienceMax
      ? 1
      : 0.8;

  const openingLocation = String(opening.location ?? "").trim();
  const candidateLocation = String(features.location ?? "").trim();
  const isRemote = /\bremote\b/i.test(openingLocation);
  const locationMatchScore = isRemote || !openingLocation || openingLocation.toLowerCase() === candidateLocation.toLowerCase()
    ? 1
    : 0.5;

  const finalScore = (0.5 * skillMatchScore) + (0.3 * experienceMatchScore) + (0.2 * locationMatchScore);
  return {
    skillMatchScore,
    experienceMatchScore,
    locationMatchScore,
    finalScore,
    recommended: finalScore >= 0.75,
    decision: finalScore >= 0.75 ? "RECOMMENDED" : finalScore >= 0.5 ? "BORDERLINE" : "NOT_RECOMMENDED",
    evidence: {
      matchedSkills,
      missingSkills,
      requiredSkillCount: requiredSkills.length,
      experienceYears,
      experienceMin,
      experienceMax,
      experienceAssessment: experienceYears < experienceMin
        ? `Below the ${experienceMin}-year minimum`
        : experienceMax === null
          ? `Meets the ${experienceMin}-year minimum; no maximum is set`
          : experienceYears <= experienceMax
            ? `Within the ${experienceMin}-${experienceMax}-year range`
            : `Above the ${experienceMax}-year maximum`,
      locationAssessment: isRemote
        ? "Remote opening; candidate location receives full credit"
        : !openingLocation
          ? "No location constraint is specified"
          : locationMatchScore === 1
            ? `Candidate location matches ${openingLocation}`
            : `Candidate location ${candidateLocation || "is not listed"} does not match ${openingLocation}`,
    },
  };
}
