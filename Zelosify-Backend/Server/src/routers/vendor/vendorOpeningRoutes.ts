import { Router, type Request, type Response, type RequestHandler } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { parseHiringProfileFiles } from "../../config/multer/hiringProfileMulter.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import { asyncHandler } from "../../utils/handler/asyncHandler.js";
import { getVendorOpening, listVendorOpenings } from "../../controllers/hiring/hiringManagementController.js";
import {
  deleteVendorProfile,
  presignVendorProfiles,
  previewVendorProfile,
  submitVendorProfiles,
} from "../../controllers/hiring/hiringProfileUploadController.js";

const router = Router();
const auth = [authenticateUser as RequestHandler, authorizeRole("IT_VENDOR") as RequestHandler];

router.get("/", ...auth, asyncHandler(async (req: Request, res: Response) => { await listVendorOpenings(req, res); }));
router.get("/:id", ...auth, asyncHandler(async (req: Request, res: Response) => { await getVendorOpening(req, res); }));
router.post("/:id/profiles/presign", ...auth, asyncHandler(async (req: Request, res: Response) => { await presignVendorProfiles(req, res); }));
router.post("/:id/profiles/upload", ...auth, parseHiringProfileFiles, asyncHandler(async (req: Request, res: Response) => { await submitVendorProfiles(req, res); }));
router.delete("/profiles/:id", ...auth, asyncHandler(async (req: Request, res: Response) => { await deleteVendorProfile(req, res); }));
router.get("/profiles/:id/preview", ...auth, asyncHandler(async (req: Request, res: Response) => { await previewVendorProfile(req, res); }));

export default router;
