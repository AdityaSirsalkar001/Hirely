import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    opening: { findFirst: vi.fn() },
    hiringProfile: { findMany: vi.fn(), findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
  storage: {
    getUploadURL: vi.fn(),
    putObject: vi.fn(),
    deleteObject: vi.fn(),
    getObjectStream: vi.fn(),
  },
  axios: { post: vi.fn(), put: vi.fn(), isAxiosError: vi.fn(() => false) },
  parsePdf: vi.fn(),
}));

vi.mock("../../../src/config/prisma/prisma.js", () => ({ default: mocks.prisma }));
vi.mock("../../../src/services/storage/storageFactory.js", () => ({ createStorageService: () => mocks.storage }));
vi.mock("../../../src/config/network/proxyAgent.js", () => ({ proxyAgent: undefined }));
vi.mock("axios", () => ({ default: mocks.axios }));
vi.mock("pdf-extraction", () => ({ default: mocks.parsePdf }));

import { presignVendorProfiles, submitVendorProfiles } from "../../../src/controllers/hiring/hiringProfileUploadController.js";
import { shortlistProfile } from "../../../src/controllers/hiring/hiringManagementController.js";
import { recommendationAgent } from "../../../src/services/hiring/recommendationAgent.js";

const opening = {
  id: "opening-1",
  tenantId: "tenant-1",
  hiringManagerId: "manager-1",
  title: "Backend Engineer",
  description: "Build reliable services",
  location: "New York",
  experienceMin: 3,
  experienceMax: 7,
  requiredSkills: ["Node.js", "Python"],
};

let profiles: Map<number, any>;
let nextId: number;

function makeProfile(data: any) {
  const id = nextId++;
  const profile = {
    id,
    ...data,
    submittedAt: new Date(),
    status: "SUBMITTED",
    recommendationStatus: "PENDING",
    recommendationMetadata: {},
    isDeleted: false,
    opening,
  };
  profiles.set(id, profile);
  return profile;
}

function createTx() {
  return {
    opening: { findFirst: vi.fn(async () => ({ id: opening.id })) },
    hiringProfile: {
      createMany: vi.fn(async ({ data }: any) => {
        data.forEach((item: any) => makeProfile(item));
        return { count: data.length };
      }),
      findMany: vi.fn(async ({ where }: any = {}) => [...profiles.values()].filter((profile) =>
        (!where?.s3Key?.in || where.s3Key.in.includes(profile.s3Key)) &&
        (!where?.uploadedBy || profile.uploadedBy === where.uploadedBy) &&
        (!where?.openingId || profile.openingId === where.openingId)
      ).map(({ id, fileName, submittedAt, status }) => ({ id, fileName, submittedAt, status }))),
      findFirst: vi.fn(async ({ where }: any) => {
        const profile = profiles.get(where.id);
        if (!profile || profile.isDeleted || profile.opening.hiringManagerId !== where.opening.is.hiringManagerId || profile.opening.tenantId !== where.opening.is.tenantId) return null;
        return { id: profile.id, status: profile.status };
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const profile = profiles.get(where.id);
        Object.assign(profile, data);
        return { id: profile.id, status: profile.status, shortlistedAt: profile.shortlistedAt, rejectedAt: profile.rejectedAt };
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        const profile = profiles.get(where.id);
        if (!profile || profile.isDeleted) return { count: 0 };
        Object.assign(profile, data);
        return { count: 1 };
      }),
    },
  };
}

function response() {
  const res: any = { statusCode: 200, body: undefined, status: vi.fn(), json: vi.fn(), send: vi.fn() };
  res.status.mockImplementation((code: number) => { res.statusCode = code; return res; });
  res.json.mockImplementation((body: any) => { res.body = body; return res; });
  res.send.mockImplementation((body: any) => { res.body = body; return res; });
  return res;
}

function makeToolCall(id: string, name: string, args: Record<string, unknown> = {}) {
  return { id, type: "function", function: { name, arguments: JSON.stringify(args) } };
}

const toolCallResponse = {
  data: {
    choices: [{ message: { role: "assistant", tool_calls: [
      makeToolCall("parse", "parse_resume"),
      makeToolCall("features", "extract_candidate_features", {
        experienceYears: 5,
        skills: ["NodeJS", "Python", ...Array.from({ length: 78 }, (_, index) => `Additional Skill ${index + 1}`), ""],
        location: "New York",
        education: ["BSc Computer Science"],
        keywords: ["backend", "API"],
      }),
      makeToolCall("normalize", "normalize_skills"),
      makeToolCall("score", "calculate_match_score"),
    ] } }],
    usage: { total_tokens: 120 },
  },
};

const explanationResponse = {
  data: {
    choices: [{ message: { content: JSON.stringify({ confidence: 0.94, reason: "Both required skills are evidenced, experience is within range, and the candidate location matches." }) } }],
    usage: { total_tokens: 40 },
  },
};

describe("vendor profile submission through recommendation to manager shortlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ENCRYPTION_ALGORITHM", "aes-256-gcm");
    vi.stubEnv("ENCRYPTION_KEY", "11".repeat(32));
    vi.stubEnv("GROQ_API_KEY", "test-key");
    profiles = new Map();
    nextId = 1;

    mocks.prisma.opening.findFirst.mockResolvedValue({ id: opening.id });
    mocks.prisma.hiringProfile.findMany.mockImplementation(async ({ where }: any) =>
      [...profiles.values()].filter((profile) => where?.s3Key?.in?.includes(profile.s3Key)).map(({ id, s3Key, uploadedBy, openingId }) => ({ id, s3Key, uploadedBy, openingId }))
    );
    mocks.prisma.hiringProfile.findFirst.mockImplementation(async ({ where }: any) => profiles.get(where.id) ?? null);
    mocks.prisma.$transaction.mockImplementation(async (operation: any) => {
      const tx = createTx();
      if (typeof operation === "function") return operation(tx);
      return Promise.all(operation);
    });
    mocks.storage.getUploadURL.mockResolvedValue("https://storage.test/signed-upload");
    mocks.storage.putObject.mockResolvedValue(undefined);
    mocks.storage.deleteObject.mockResolvedValue(undefined);
    mocks.storage.getObjectStream.mockImplementation(async () => Readable.from([Buffer.from("%PDF-1.4\nfixture resume\n")]));
    mocks.parsePdf.mockResolvedValue({ text: "Backend engineer with 5 years of experience. Skills: Node.js, Python. Location: New York." });
    mocks.axios.post.mockImplementation(async (_url: string, payload: any) => payload.tools ? toolCallResponse : explanationResponse);
    vi.spyOn(recommendationAgent, "enqueue").mockImplementation(() => undefined);
  });

  it("presigns and submits a PDF, runs the tool-calling analysis, and permits its manager to shortlist", async () => {
    const vendor = { id: "vendor-1", tenant: { tenantId: "tenant-1" } };
    const presignRes = response();
    await presignVendorProfiles({
      params: { id: opening.id },
      body: { files: [{ fileName: "candidate.pdf", size: 128 }] },
      user: vendor,
    } as any, presignRes);
    expect(presignRes.statusCode).toBe(200);
    const upload = presignRes.body.data[0];

    const file = {
      originalname: "candidate.pdf",
      mimetype: "application/pdf",
      size: 25,
      buffer: Buffer.from("%PDF-1.4\nfixture resume\n"),
    };
    const submitRes = response();
    await submitVendorProfiles({
      params: { id: opening.id },
      body: { uploadTokens: JSON.stringify([upload.uploadToken]) },
      files: [file],
      user: vendor,
    } as any, submitRes);

    expect(submitRes.statusCode).toBe(201);
    expect(submitRes.body.data).toHaveLength(1);
    expect(mocks.storage.putObject).toHaveBeenCalledOnce();
    expect(recommendationAgent.enqueue).toHaveBeenCalledWith(submitRes.body.data[0].id);

    const profileId = submitRes.body.data[0].id;
    await recommendationAgent.processProfile(profileId);
    const analyzed = profiles.get(profileId);
    expect(analyzed.recommendationStatus).toBe("COMPLETED");
    expect(analyzed.recommended).toBe(true);
    expect(analyzed.recommendationScore).toBe(1);
    expect(analyzed.recommendationMetadata.checkpoints.features.skills).toHaveLength(80);
    expect(analyzed.recommendationMetadata.checkpoints.features.skills).not.toContain("");
    expect(analyzed.recommendationConfidence).toBe(0.94);
    expect(analyzed.recommendationTokenUsage).toBe(160);
    expect(analyzed.recommendationMetadata.toolTrace.map((step: any) => step.tool)).toEqual([
      "parse_resume", "extract_candidate_features", "normalize_skills", "calculate_match_score",
    ]);

    const managerRes = response();
    await shortlistProfile({
      params: { id: String(profileId) },
      user: { id: "manager-1", tenant: { tenantId: "tenant-1" } },
    } as any, managerRes);
    expect(managerRes.body.data.status).toBe("SHORTLISTED");
    expect(analyzed.status).toBe("SHORTLISTED");
  });

  it("keeps the full agent pipeline below the 2-second P95 target in a 100-profile mocked run", async () => {
    const { performance } = await import("node:perf_hooks");
    const capturedLogs: string[] = [];
    const logSpy = vi.spyOn(console, "log").mockImplementation((...args) => { capturedLogs.push(args.join(" ")); });
    const ids = Array.from({ length: 100 }, (_, index) => {
      const profile = makeProfile({
        openingId: opening.id,
        s3Key: `tenant-1/${opening.id}/profile-${index}.pdf`,
        fileName: `profile-${index}.pdf`,
        uploadedBy: "vendor-1",
      });
      return profile.id;
    });

    const timings: number[] = [];
    // The default worker concurrency is one; model that steady state while
    // simulating a 100-profile queue and measuring each profile end to end.
    for (const id of ids) {
      const started = performance.now();
      await recommendationAgent.processProfile(id);
      timings.push(performance.now() - started);
    }
    logSpy.mockRestore();

    const sorted = timings.sort((a, b) => a - b);
    const p95Ms = sorted[Math.ceil(sorted.length * 0.95) - 1];
    const failures = capturedLogs.filter((line) => line.includes('"event":"recommendation_failed"')).slice(0, 3);
    const maxMs = sorted.at(-1)!;
    console.warn(JSON.stringify({ benchmark: "100-profile mocked recommendation pipeline", profiles: sorted.length, completed: [...profiles.values()].filter((profile) => profile.recommendationStatus === "COMPLETED").length, p95Ms: Number(p95Ms.toFixed(2)), maxMs: Number(maxMs.toFixed(2)), failures, provider: "mocked Groq responses", persistence: "in-memory Prisma mock" }));
    expect(sorted).toHaveLength(100);
    expect([...profiles.values()].every((profile) => profile.recommendationStatus === "COMPLETED"), JSON.stringify({ completed: [...profiles.values()].filter((profile) => profile.recommendationStatus === "COMPLETED").length, failures })).toBe(true);
    expect(p95Ms).toBeLessThan(2000);
    expect(maxMs).toBeLessThan(1500);
  });
});
