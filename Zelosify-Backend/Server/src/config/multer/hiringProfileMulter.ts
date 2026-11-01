import multer from "multer";
import type { RequestHandler } from "express";

const parseFiles = multer({
  storage: multer.memoryStorage(),
  limits: { files: 10, fileSize: 20 * 1024 * 1024 },
}).array("files", 10);

export const parseHiringProfileFiles: RequestHandler = (req, res, next) => {
  parseFiles(req, res, (error: any) => {
    if (!error) return next();
    const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(statusCode).json({ message: error.message || "Invalid profile upload" });
  });
};
