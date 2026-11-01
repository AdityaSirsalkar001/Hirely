import { randomUUID } from "crypto";
import path from "path";
import axios from "axios";
import { ProfileStatus } from "@prisma/client";
import prisma from "../../config/prisma/prisma.js";
import { sanitizeFilename } from "../../helpers/vendorRequestValidation.js";
import { createStorageService } from "../storage/storageFactory.js";
import { decrypt, encrypt } from "../../utils/encryption/encryption.js";

const MAX_FILES_PER_REQUEST = 10;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const UPLOAD_URL_TTL_SECONDS = 300;
const MIME_BY_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

function hasConfiguredHttpsProxy() {
  return Boolean(process.env.HTTPS_PROXY || process.env.https_proxy || process.env.ALL_PROXY || process.env.all_proxy);
}

function storageFailureSummary(error: unknown) {
  if (!axios.isAxiosError(error)) return "Storage request failed";
  const status = error.response?.status;
  const code = error.code;
  if (status) return `Storage rejected the upload (HTTP ${status})`;
  if (code) return `Storage connection failed (${code})`;
  return "Storage connection failed";
}

export class HiringProfileServiceError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "HiringProfileServiceError";
  }
}

export type RequestedProfileFile = {
  fileName: string;
  size: number;
};

type UploadClaim = {
  key: string;
  url: string;
  filename: string;
  tenantId: string;
  expiresAt: number;
  customFields: { userId: string; openingId: string; contentType: string };
};

export type BufferedProfileFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

function normalizeFile(file: RequestedProfileFile) {
  if (typeof file.fileName !== "string" || !Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_FILE_BYTES) {
    throw new HiringProfileServiceError("Each file needs a name and must be between 1 byte and 20 MB", 400);
  }
  const ext = path.extname(file.fileName).toLowerCase();
  const contentType = MIME_BY_EXTENSION[ext];
  if (!contentType) throw new HiringProfileServiceError("Only PDF and PPTX profiles are supported", 400);
  const sanitizedName = sanitizeFilename(path.basename(file.fileName)).slice(0, 180);
  const safeFileName = !sanitizedName || sanitizedName === ext ? `candidate${ext}` : sanitizedName;
  return { fileName: safeFileName, size: file.size, contentType };
}

function readClaim(token: string): UploadClaim {
  try {
    const claim = JSON.parse(decrypt(token)) as UploadClaim;
    if (!claim.key || !claim.filename || !claim.url || !claim.tenantId || !claim.customFields?.userId || !claim.customFields?.openingId || !claim.expiresAt) {
      throw new HiringProfileServiceError("Incomplete upload claim", 400);
    }
    if (Date.now() > claim.expiresAt) throw new HiringProfileServiceError("Upload claim has expired", 400);
    return claim;
  } catch (error) {
    if (error instanceof HiringProfileServiceError) throw error;
    throw new HiringProfileServiceError("Invalid or expired upload token", 400);
  }
}

export class HiringProfileUploadService {
  async createPresignedUploads(input: {
    openingId: string;
    tenantId: string;
    userId: string;
    files: RequestedProfileFile[];
  }) {
    if (!Array.isArray(input.files) || input.files.length < 1 || input.files.length > MAX_FILES_PER_REQUEST) {
      throw new HiringProfileServiceError(`Upload between 1 and ${MAX_FILES_PER_REQUEST} files at a time`, 400);
    }

    const opening = await prisma.opening.findFirst({
      where: { id: input.openingId, tenantId: input.tenantId, status: "OPEN" },
      select: { id: true },
    });
    if (!opening) throw new HiringProfileServiceError("Opening not found or not open", 404);

    const storage = createStorageService();
    const normalizedFiles = input.files.map(normalizeFile);
    return Promise.all(normalizedFiles.map(async (file) => {
      const key = `${input.tenantId}/${input.openingId}/${Date.now()}_${randomUUID()}_${file.fileName}`;
      const expiresAt = Date.now() + UPLOAD_URL_TTL_SECONDS * 1000;
      const uploadUrl = await storage.getUploadURL(key, file.contentType, UPLOAD_URL_TTL_SECONDS);
      const uploadToken = encrypt(JSON.stringify({
        key,
        url: uploadUrl,
        filename: file.fileName,
        tenantId: input.tenantId,
        expiresAt,
        customFields: { userId: input.userId, openingId: input.openingId, contentType: file.contentType },
      } satisfies UploadClaim));
      return {
        fileName: file.fileName,
        uploadToken,
        // Axios already prefixes requests with /api/v1.
        uploadEndpoint: `/vendor/openings/${encodeURIComponent(input.openingId)}/profiles/upload`,
        expiresIn: UPLOAD_URL_TTL_SECONDS,
      };
    }));
  }

  async uploadAndSubmitProfiles(input: {
    openingId: string;
    tenantId: string;
    userId: string;
    files: BufferedProfileFile[];
    uploadTokens: string[];
  }) {
    if (!Array.isArray(input.files) || input.files.length < 1 || input.files.length > MAX_FILES_PER_REQUEST || !Array.isArray(input.uploadTokens) || input.uploadTokens.length !== input.files.length) {
      throw new HiringProfileServiceError(`Upload between 1 and ${MAX_FILES_PER_REQUEST} files with one matching token per file`, 400);
    }
    const claims = input.uploadTokens.map(readClaim);
    const keys = claims.map((claim) => claim.key);
    if (new Set(keys).size !== keys.length) throw new HiringProfileServiceError("Duplicate upload tokens are not allowed", 400);
    for (const claim of claims) {
      if (claim.customFields.userId !== input.userId || claim.tenantId !== input.tenantId || claim.customFields.openingId !== input.openingId || !claim.key.startsWith(`${input.tenantId}/${input.openingId}/`)) {
        throw new HiringProfileServiceError("Upload token does not belong to this user or opening", 403);
      }
    }

    const storage = createStorageService();
    const normalizedFiles = input.files.map((file) => normalizeFile({ fileName: file.originalname, size: file.size }));
    for (let index = 0; index < claims.length; index += 1) {
      if (normalizedFiles[index].fileName !== claims[index].filename || normalizedFiles[index].contentType !== claims[index].customFields.contentType || input.files[index].mimetype !== claims[index].customFields.contentType) {
        throw new HiringProfileServiceError("File does not match its upload token", 400);
      }
      const signature = input.files[index].buffer.subarray(0, 5).toString("ascii");
      const validSignature = normalizedFiles[index].contentType === "application/pdf"
        ? signature.startsWith("%PDF-")
        : input.files[index].buffer.subarray(0, 4).toString("hex") === "504b0304";
      if (!validSignature) throw new HiringProfileServiceError(`File content does not match ${normalizedFiles[index].fileName}`, 400);
    }

    const prior = await prisma.hiringProfile.findMany({
      where: { s3Key: { in: keys } },
      select: { s3Key: true, uploadedBy: true, openingId: true },
    });
    if (prior.some((record) => record.uploadedBy !== input.userId || record.openingId !== input.openingId)) {
      throw new HiringProfileServiceError("Upload token has already been used", 409);
    }
    const alreadySubmitted = new Set(prior.map((record) => record.s3Key));
    const pendingIndexes = claims.map((claim, index) => ({ claim, index })).filter(({ claim }) => !alreadySubmitted.has(claim.key));
    const uploadedKeys: string[] = [];

    try {
      const results = await Promise.allSettled(pendingIndexes.map(async ({ claim, index }) => {
        const requestConfig = {
            headers: { "Content-Type": input.files[index].mimetype },
            maxRedirects: 0,
            maxBodyLength: MAX_FILE_BYTES,
            maxContentLength: MAX_FILE_BYTES,
            timeout: 30_000,
        };
        try {
          // Try the AWS SDK first, then the signed URL through configured and direct routes.
          try {
            await storage.putObject(claim.key, input.files[index].buffer, input.files[index].mimetype);
            uploadedKeys.push(claim.key);
          } catch (putError) {
            console.warn("Direct storage putObject failed; trying signed URL fallback:", storageFailureSummary(putError));
            let response;
            try {
              response = await axios.put(claim.url, input.files[index].buffer, requestConfig);
            } catch (proxyError) {
              response = await axios.put(claim.url, input.files[index].buffer, {
                ...requestConfig,
                proxy: false,
              });
            }
            if (response.status !== 200) {
              throw new HiringProfileServiceError(`Storage rejected the upload (HTTP ${response.status})`, 502);
            }
            uploadedKeys.push(claim.key);
          }
        } catch (error) {
          if (error instanceof HiringProfileServiceError) throw error;
          const summary = storageFailureSummary(error);
          console.error("Hiring profile storage upload failed:", summary);
          throw new HiringProfileServiceError(
            summary === "Storage connection failed"
              ? "Could not connect to profile storage. Check your internet connection and try again."
              : `${summary}. Please contact the administrator if it continues.`,
            502
          );
        }
      }));
      const failedUpload = results.find((result) => result.status === "rejected");
      if (failedUpload?.status === "rejected") throw failedUpload.reason;

      const profiles = await prisma.$transaction(async (transaction) => {
        const opening = await transaction.opening.findFirst({
          where: { id: input.openingId, tenantId: input.tenantId, status: "OPEN" },
          select: { id: true },
        });
        if (!opening) throw new HiringProfileServiceError("Opening not found or no longer open", 404);

        await transaction.hiringProfile.createMany({
          data: pendingIndexes.map(({ claim }) => ({
            openingId: input.openingId,
            s3Key: claim.key,
            fileName: claim.filename,
            uploadedBy: input.userId,
            status: ProfileStatus.SUBMITTED,
          })),
          skipDuplicates: true,
        });
        return transaction.hiringProfile.findMany({
          where: { s3Key: { in: keys }, uploadedBy: input.userId, openingId: input.openingId },
          select: { id: true, fileName: true, submittedAt: true, status: true },
        });
      });
      return profiles;
    } catch (error) {
      await Promise.allSettled(uploadedKeys.map((key) => storage.deleteObject(key)));
      throw error;
    }
  }

  async softDeleteProfile(input: { profileId: number; tenantId: string; userId: string }) {
    return prisma.$transaction(async (transaction) => {
      const profile = await transaction.hiringProfile.findFirst({
        where: {
          id: input.profileId,
          uploadedBy: input.userId,
          isDeleted: false,
          opening: { is: { tenantId: input.tenantId } },
        },
        select: { id: true },
      });
      if (!profile) return false;
      await transaction.hiringProfile.update({ where: { id: profile.id }, data: { isDeleted: true } });
      return true;
    });
  }

  async getAuthorizedProfile(input: { profileId: number; tenantId: string; userId: string; role: "IT_VENDOR" | "HIRING_MANAGER" }) {
    return prisma.hiringProfile.findFirst({
      where: {
        id: input.profileId,
        isDeleted: false,
        ...(input.role === "IT_VENDOR" ? { uploadedBy: input.userId } : {}),
        opening: {
          is: {
            tenantId: input.tenantId,
            ...(input.role === "HIRING_MANAGER" ? { hiringManagerId: input.userId } : {}),
          },
        },
      },
      select: { id: true, fileName: true, s3Key: true },
    });
  }
}

export const hiringProfileUploadService = new HiringProfileUploadService();
