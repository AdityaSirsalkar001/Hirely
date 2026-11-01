CREATE INDEX "HiringProfile_isDeleted_recommendationStatus_recommendationStartedAt_submittedAt_idx"
ON "HiringProfile"("isDeleted", "recommendationStatus", "recommendationStartedAt", "submittedAt");
