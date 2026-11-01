import path from "path";
import type { Request, Response } from "express";
import { createStorageService } from "../../services/storage/storageFactory.js";
import {
  hiringProfileUploadService,
  HiringProfileServiceError,
} from "../../services/hiring/hiringProfileUploadService.js";
import { recommendationAgent } from "../../services/hiring/recommendationAgent.js";

type HiringRequest = Request & {
  user?: { id?: string; tenant?: { tenantId?: string } | null };
};

function requestIdentity(req: Request) {
  const user = (req as HiringRequest).user;
  if (!user?.id || !user.tenant?.tenantId) return null;
  return { userId: user.id, tenantId: user.tenant.tenantId };
}

function handleServiceError(res: Response, error: unknown) {
  if (error instanceof HiringProfileServiceError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }
  throw error;
}

export async function presignVendorProfiles(req: Request, res: Response) {
  const current = requestIdentity(req);
  if (!current) return res.status(403).json({ message: "A tenant-bound user is required" });
  try {
    const files = req.body?.files;
    if (!Array.isArray(files)) return res.status(400).json({ message: "files must be an array" });
    const uploads = await hiringProfileUploadService.createPresignedUploads({
      openingId: req.params.id,
      tenantId: current.tenantId,
      userId: current.userId,
      files,
    });
    return res.status(200).json({ data: uploads });
  } catch (error) {
    return handleServiceError(res, error);
  }
}

export async function submitVendorProfiles(req: Request, res: Response) {
  const current = requestIdentity(req);
  if (!current) return res.status(403).json({ message: "A tenant-bound user is required" });
  try {
    const files = (req as Request & { files?: Express.Multer.File[] }).files ?? [];
    let uploadTokens: string[];
    try {
      const tokenField = req.body?.uploadTokens;
      uploadTokens = Array.isArray(tokenField) ? tokenField : JSON.parse(tokenField);
    } catch {
      return res.status(400).json({ message: "uploadTokens must be a JSON array" });
    }
    if (!Array.isArray(uploadTokens) || uploadTokens.some((token) => typeof token !== "string")) {
      return res.status(400).json({ message: "uploadTokens must be a JSON array of strings" });
    }
    const profiles = await hiringProfileUploadService.uploadAndSubmitProfiles({
      openingId: req.params.id,
      tenantId: current.tenantId,
      userId: current.userId,
      files,
      uploadTokens,
    });
    profiles.forEach((profile) => recommendationAgent.enqueue(profile.id));
    return res.status(201).json({ data: profiles });
  } catch (error) {
    return handleServiceError(res, error);
  }
}

export async function deleteVendorProfile(req: Request, res: Response) {
  const current = requestIdentity(req);
  if (!current) return res.status(403).json({ message: "A tenant-bound user is required" });
  const profileId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(profileId) || profileId < 1) return res.status(400).json({ message: "Invalid profile id" });
  const deleted = await hiringProfileUploadService.softDeleteProfile({
    profileId,
    tenantId: current.tenantId,
    userId: current.userId,
  });
  if (!deleted) return res.status(404).json({ message: "Profile not found" });
  return res.status(204).send();
}

export async function previewHiringProfile(req: Request, res: Response, role: "IT_VENDOR" | "HIRING_MANAGER") {
  const current = requestIdentity(req);
  if (!current) return res.status(403).json({ message: "A tenant-bound user is required" });
  const profileId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(profileId) || profileId < 1) return res.status(400).json({ message: "Invalid profile id" });

  const profile = await hiringProfileUploadService.getAuthorizedProfile({
    profileId,
    tenantId: current.tenantId,
    userId: current.userId,
    role,
  });
  if (!profile) return res.status(404).json({ message: "Profile not found" });

  const contentType = path.extname(profile.fileName).toLowerCase() === ".pdf"
    ? "application/pdf"
    : "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  const disposition = contentType === "application/pdf" ? "inline" : "attachment";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `${disposition}; filename="${profile.fileName.replace(/["\\]/g, "_")}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  const stream = await createStorageService().getObjectStream(profile.s3Key);
  stream.on("error", (error) => {
    console.error(JSON.stringify({ event: "hiring_profile_preview_failed", profileId, error: error.message }));
    if (!res.headersSent) res.status(500).end();
    else res.destroy(error);
  });
  stream.pipe(res);
}

export async function previewVendorProfile(req: Request, res: Response) {
  return previewHiringProfile(req, res, "IT_VENDOR");
}

export async function previewManagerProfile(req: Request, res: Response) {
  return previewHiringProfile(req, res, "HIRING_MANAGER");
}
