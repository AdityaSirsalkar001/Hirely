/**
 * Canonicalize resume and opening skills before deterministic matching.
 * This is exposed to the recommendation agent as the normalize_skills tool.
 */

const aliases: Record<string, string> = {
  "amazon web services": "aws",
  "aws cloud": "aws",
  "c plus plus": "c++",
  cpp: "c++",
  "c sharp": "c#",
  csharp: "c#",
  ecmascript: "javascript",
  js: "javascript",
  "java script": "javascript",
  "machine-learning": "machine learning",
  ml: "machine learning",
  mlops: "mlops",
  "node js": "node.js",
  nodejs: "node.js",
  node: "node.js",
  "google cloud platform": "gcp",
  "google cloud": "gcp",
  k8s: "kubernetes",
  postgres: "postgresql",
  "postgre sql": "postgresql",
  reactjs: "react",
  "react js": "react",
  sklearn: "scikit-learn",
  "scikit learn": "scikit-learn",
  ts: "typescript",
  "type script": "typescript",
  py: "python",
  python3: "python",
  golang: "go",
  "mongo db": "mongodb",
};

function normalizeSkillName(skill: unknown): string {
  const value = String(skill ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!value) return "";

  const compact = value.replace(/[\s._-]/g, "");
  if (/^c\+\+(?:98|03|11|14|17|20|23)?$/.test(compact)) return "c++";
  if (/^python(?:2|3)(?:\.\d+)?$/.test(compact)) return "python";
  if (/^node(?:\.js|js)?\d*(?:\.\d+)?$/.test(compact)) return "node.js";
  if (/^react(?:\.js|js)?$/.test(compact)) return "react";
  if (/^postgres(?:ql)?$/.test(compact)) return "postgresql";

  return aliases[compact] ?? aliases[value] ?? value;
}

function normalizeList(skills: unknown): string[] {
  if (!Array.isArray(skills)) return [];
  return [...new Set(skills.map(normalizeSkillName).filter(Boolean))];
}

export function normalizeSkillsTool(candidateSkills: unknown, requiredSkills: unknown) {
  return {
    candidateSkills: normalizeList(candidateSkills),
    requiredSkills: normalizeList(requiredSkills),
  };
}
