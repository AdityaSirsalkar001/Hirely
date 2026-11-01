CREATE TYPE "OpeningStatus" AS ENUM ('OPEN', 'CLOSED', 'ON_HOLD');
CREATE TYPE "ProfileStatus" AS ENUM ('SUBMITTED', 'SHORTLISTED', 'REJECTED');
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "Opening" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "location" TEXT,
  "contractType" TEXT,
  "hiringManagerId" TEXT NOT NULL,
  "experienceMin" INTEGER NOT NULL,
  "experienceMax" INTEGER,
  "requiredSkills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "postedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expectedCompletionDate" TIMESTAMP(3),
  "actionDate" TIMESTAMP(3),
  "status" "OpeningStatus" NOT NULL DEFAULT 'OPEN',
  CONSTRAINT "Opening_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HiringProfile" (
  "id" SERIAL NOT NULL,
  "openingId" TEXT NOT NULL,
  "s3Key" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "uploadedBy" TEXT NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "ProfileStatus" NOT NULL DEFAULT 'SUBMITTED',
  "shortlistedBy" TEXT,
  "shortlistedAt" TIMESTAMP(3),
  "rejectedBy" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "recommended" BOOLEAN,
  "recommendationScore" DOUBLE PRECISION,
  "recommendationReason" TEXT,
  "recommendationLatencyMs" INTEGER,
  "recommendationVersion" TEXT,
  "recommendationConfidence" DOUBLE PRECISION,
  "recommendedAt" TIMESTAMP(3),
  "recommendationStatus" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
  "recommendationStartedAt" TIMESTAMP(3),
  "recommendationCompletedAt" TIMESTAMP(3),
  "recommendationTokenUsage" INTEGER,
  "recommendationMetadata" JSONB,
  "recommendationError" TEXT,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "HiringProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HiringProfile_s3Key_key" ON "HiringProfile"("s3Key");
CREATE INDEX "Opening_tenantId_status_postedDate_idx" ON "Opening"("tenantId", "status", "postedDate");
CREATE INDEX "Opening_hiringManagerId_status_idx" ON "Opening"("hiringManagerId", "status");
CREATE INDEX "HiringProfile_openingId_isDeleted_submittedAt_idx" ON "HiringProfile"("openingId", "isDeleted", "submittedAt");
CREATE INDEX "HiringProfile_recommended_idx" ON "HiringProfile"("recommended");

ALTER TABLE "Opening" ADD CONSTRAINT "Opening_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Opening" ADD CONSTRAINT "Opening_hiringManagerId_fkey"
  FOREIGN KEY ("hiringManagerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HiringProfile" ADD CONSTRAINT "HiringProfile_openingId_fkey"
  FOREIGN KEY ("openingId") REFERENCES "Opening"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HiringProfile" ADD CONSTRAINT "HiringProfile_uploadedBy_fkey"
  FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HiringProfile" ADD CONSTRAINT "HiringProfile_shortlistedBy_fkey"
  FOREIGN KEY ("shortlistedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HiringProfile" ADD CONSTRAINT "HiringProfile_rejectedBy_fkey"
  FOREIGN KEY ("rejectedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
