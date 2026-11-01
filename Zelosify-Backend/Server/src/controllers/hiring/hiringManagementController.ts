import type { Request, Response } from "express";
import { OpeningStatus, ProfileStatus } from "@prisma/client";
import prisma from "../../config/prisma/prisma.js";

type HiringRequest = Request & {
  user?: {
    id?: string;
    tenant?: { tenantId?: string } | null;
  };
};

function identity(req: HiringRequest) {
  const userId = req.user?.id;
  const tenantId = req.user?.tenant?.tenantId;
  if (!userId || !tenantId) return null;
  return { userId, tenantId };
}

function pagination(req: Request) {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(String(req.query.limit ?? "20"), 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function recommendationLabel(score: number | null) {
  if (score === null) return "Processing";
  if (score >= 0.75) return "Recommended";
  if (score >= 0.5) return "Borderline";
  return "Not Recommended";
}

export async function listVendorOpenings(req: Request, res: Response) {
  const current = identity(req as HiringRequest);
  if (!current) return res.status(403).json({ message: "A tenant-bound user is required" });
  const { page, limit, skip } = pagination(req);

  const where = { tenantId: current.tenantId, status: OpeningStatus.OPEN };
  const [openings, total] = await prisma.$transaction([
    prisma.opening.findMany({
      where,
      skip,
      take: limit,
      orderBy: { postedDate: "desc" },
      include: {
        hiringManager: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.opening.count({ where }),
  ]);

  return res.json({
    data: openings.map(({ hiringManager, ...opening }) => ({
      ...opening,
      hiringManagerName: [hiringManager.firstName, hiringManager.lastName].filter(Boolean).join(" "),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getVendorOpening(req: Request, res: Response) {
  const current = identity(req as HiringRequest);
  if (!current) return res.status(403).json({ message: "A tenant-bound user is required" });
  const opening = await prisma.opening.findFirst({
    where: { id: req.params.id, tenantId: current.tenantId },
    include: {
      hiringManager: { select: { firstName: true, lastName: true } },
      hiringProfiles: {
        where: { uploadedBy: current.userId, isDeleted: false },
        select: { id: true, fileName: true, submittedAt: true },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!opening) return res.status(404).json({ message: "Opening not found" });

  const { hiringManager, hiringProfiles, ...details } = opening;
  return res.json({
    data: {
      ...details,
      hiringManagerName: [hiringManager.firstName, hiringManager.lastName].filter(Boolean).join(" "),
      profilesCount: hiringProfiles.length,
      profiles: hiringProfiles,
    },
  });
}

export async function listHiringManagerOpenings(req: Request, res: Response) {
  const current = identity(req as HiringRequest);
  if (!current) return res.status(403).json({ message: "A tenant-bound user is required" });
  const { page, limit, skip } = pagination(req);
  const where = { hiringManagerId: current.userId, tenantId: current.tenantId };
  const [openings, total] = await prisma.$transaction([
    prisma.opening.findMany({
      where,
      skip,
      take: limit,
      orderBy: { postedDate: "desc" },
      include: { _count: { select: { hiringProfiles: { where: { isDeleted: false } } } } },
    }),
    prisma.opening.count({ where }),
  ]);

  return res.json({
    data: openings.map((opening) => ({ ...opening, profilesCount: opening._count.hiringProfiles, _count: undefined })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function createHiringManagerOpening(req: Request, res: Response) {
  const current = identity(req as HiringRequest);
  if (!current) return res.status(403).json({ message: "A tenant-bound user is required" });

  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
  const location = typeof req.body?.location === "string" ? req.body.location.trim() : "";
  const contractType = typeof req.body?.contractType === "string" ? req.body.contractType.trim() : "";
  const minRaw = req.body?.experienceMin;
  const maxRaw = req.body?.experienceMax;
  const experienceMin = Number(minRaw);
  const experienceMax = maxRaw === "" || maxRaw == null ? null : Number(maxRaw);
  const requiredSkills: string[] = Array.isArray(req.body?.requiredSkills)
    ? req.body.requiredSkills.filter((skill: unknown): skill is string => typeof skill === "string").map((skill: string) => skill.trim()).filter(Boolean)
    : typeof req.body?.requiredSkills === "string"
      ? req.body.requiredSkills.split(",").map((skill: string) => skill.trim()).filter(Boolean)
      : [];

  if (!title || title.length > 120 || !Number.isInteger(experienceMin) || experienceMin < 0 ||
      (experienceMax !== null && (!Number.isInteger(experienceMax) || experienceMax < experienceMin)) ||
      requiredSkills.length > 30 || requiredSkills.some((skill: string) => skill.length > 80)) {
    return res.status(400).json({ message: "Enter a job title, valid experience range, and up to 30 skills." });
  }

  const opening = await prisma.opening.create({
    data: {
      tenantId: current.tenantId,
      hiringManagerId: current.userId,
      title,
      description: description || null,
      location: location || null,
      contractType: contractType || null,
      experienceMin,
      experienceMax,
      requiredSkills: [...new Set(requiredSkills)],
    },
  });
  return res.status(201).json({ data: { ...opening, profilesCount: 0 } });
}

export async function deleteHiringManagerOpening(req: Request, res: Response) {
  const current = identity(req as HiringRequest);
  if (!current) return res.status(403).json({ message: "A tenant-bound user is required" });

  const opening = await prisma.opening.findFirst({
    where: { id: req.params.id, hiringManagerId: current.userId, tenantId: current.tenantId },
    select: { id: true, hiringProfiles: { select: { id: true, s3Key: true } } },
  });
  if (!opening) return res.status(404).json({ message: "Opening not found" });

  await prisma.$transaction(async (transaction) => {
    await transaction.hiringProfile.deleteMany({ where: { openingId: opening.id } });
    await transaction.opening.delete({ where: { id: opening.id } });
  });

  if (opening.hiringProfiles.length) {
    try {
      const { createStorageService } = await import("../../services/storage/storageFactory.js");
      const storage = createStorageService();
      const cleanup = await Promise.allSettled(opening.hiringProfiles.map(({ s3Key }) => storage.deleteObject(s3Key)));
      const failedDeletes = cleanup.filter((result) => result.status === "rejected").length;
      if (failedDeletes) console.error(JSON.stringify({ event: "deleted_opening_file_cleanup_failed", openingId: opening.id, failedDeletes }));
    } catch (error) {
      console.error(JSON.stringify({ event: "deleted_opening_file_cleanup_failed", openingId: opening.id, message: error instanceof Error ? error.message : "unknown error" }));
    }
  }

  return res.status(204).send();
}

export async function listHiringManagerProfiles(req: Request, res: Response) {
  const current = identity(req as HiringRequest);
  if (!current) return res.status(403).json({ message: "A tenant-bound user is required" });
  const opening = await prisma.opening.findFirst({
    where: { id: req.params.id, hiringManagerId: current.userId, tenantId: current.tenantId },
    select: { id: true },
  });
  if (!opening) return res.status(404).json({ message: "Opening not found" });

  const { page, limit, skip } = pagination(req);
  const where = { openingId: opening.id, isDeleted: false };
  const [profiles, total] = await prisma.$transaction([
    prisma.hiringProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        fileName: true,
        submittedAt: true,
        status: true,
        recommendationStatus: true,
        recommended: true,
        recommendationScore: true,
        recommendationReason: true,
        recommendationError: true,
        recommendationLatencyMs: true,
        recommendationConfidence: true,
        recommendedAt: true,
        recommendationMetadata: true,
      },
    }),
    prisma.hiringProfile.count({ where }),
  ]);

  return res.json({
    data: profiles.map((profile) => {
      const metadata = profile.recommendationMetadata;
      const metadataRecord = metadata && typeof metadata === "object" && !Array.isArray(metadata)
        ? metadata as Record<string, unknown>
        : null;
      const rawBreakdown = metadataRecord?.scoreBreakdown;
      const breakdown = rawBreakdown && typeof rawBreakdown === "object" && !Array.isArray(rawBreakdown)
        ? rawBreakdown as Record<string, unknown>
        : null;
      const score = (key: string) => typeof breakdown?.[key] === "number" ? breakdown[key] : null;
      const { recommendationMetadata: _privateMetadata, ...publicProfile } = profile;
      return {
        ...publicProfile,
        recommendationLabel: recommendationLabel(profile.recommendationScore),
        recommendationScoreBreakdown: breakdown ? {
          skillMatchScore: score("skillMatchScore"),
          experienceMatchScore: score("experienceMatchScore"),
          locationMatchScore: score("locationMatchScore"),
          finalScore: score("finalScore"),
        } : null,
      };
    }),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

async function decideProfile(req: Request, res: Response, decision: ProfileStatus) {
  const current = identity(req as HiringRequest);
  if (!current) return res.status(403).json({ message: "A tenant-bound user is required" });
  const profileId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(profileId) || profileId < 1) {
    return res.status(400).json({ message: "Invalid profile id" });
  }

  const result = await prisma.$transaction(async (transaction) => {
    const profile = await transaction.hiringProfile.findFirst({
      where: {
        id: profileId,
        isDeleted: false,
        opening: { is: { hiringManagerId: current.userId, tenantId: current.tenantId } },
      },
      select: { id: true, status: true },
    });
    if (!profile) return { kind: "missing" as const };
    if (profile.status === decision) return { kind: "updated" as const, profile };
    if (profile.status !== ProfileStatus.SUBMITTED) return { kind: "conflict" as const };

    const now = new Date();
    const updated = await transaction.hiringProfile.update({
      where: { id: profile.id },
      data: decision === ProfileStatus.SHORTLISTED
        ? { status: decision, shortlistedBy: current.userId, shortlistedAt: now }
        : { status: decision, rejectedBy: current.userId, rejectedAt: now },
      select: { id: true, status: true, shortlistedAt: true, rejectedAt: true },
    });
    return { kind: "updated" as const, profile: updated };
  });

  if (result.kind === "missing") return res.status(404).json({ message: "Profile not found" });
  if (result.kind === "conflict") return res.status(409).json({ message: "Profile has already been decided" });
  return res.json({ data: result.profile });
}

export function shortlistProfile(req: Request, res: Response) {
  return decideProfile(req, res, ProfileStatus.SHORTLISTED);
}

export function rejectProfile(req: Request, res: Response) {
  return decideProfile(req, res, ProfileStatus.REJECTED);
}

export async function reanalyzeProfile(req: Request, res: Response) {
  const current = identity(req as HiringRequest);
  if (!current) return res.status(403).json({ message: "A tenant-bound user is required" });
  const profileId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(profileId) || profileId < 1) {
    return res.status(400).json({ message: "Invalid profile id" });
  }
  const profile = await prisma.hiringProfile.findFirst({
    where: {
      id: profileId,
      isDeleted: false,
      opening: { is: { hiringManagerId: current.userId, tenantId: current.tenantId } },
    },
    select: { id: true },
  });
  if (!profile) return res.status(404).json({ message: "Profile not found" });

  await prisma.hiringProfile.update({
    where: { id: profile.id },
    data: { recommendationStatus: "PENDING", recommendationError: null, recommendationMetadata: { automaticRetryCount: 0 } },
  });
  const { recommendationAgent } = await import("../../services/hiring/recommendationAgent.js");
  recommendationAgent.enqueue(profile.id);
  return res.json({ message: "Analysis started", data: { id: profile.id, recommendationStatus: "PENDING" } });
}
