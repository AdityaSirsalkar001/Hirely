import { Router, type Request, type Response, type RequestHandler } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import { asyncHandler } from "../../utils/handler/asyncHandler.js";
import {
  listHiringManagerOpenings,
  listHiringManagerProfiles,
  createHiringManagerOpening,
  deleteHiringManagerOpening,
  reanalyzeProfile,
  rejectProfile,
  shortlistProfile,
} from "../../controllers/hiring/hiringManagementController.js";
import { previewManagerProfile } from "../../controllers/hiring/hiringProfileUploadController.js";

const router = Router();
const auth = [authenticateUser as RequestHandler, authorizeRole("HIRING_MANAGER") as RequestHandler];

router.get("/openings", ...auth, asyncHandler(async (req: Request, res: Response) => { await listHiringManagerOpenings(req, res); }));
router.post("/openings", ...auth, asyncHandler(async (req: Request, res: Response) => { await createHiringManagerOpening(req, res); }));
router.delete("/openings/:id", ...auth, asyncHandler(async (req: Request, res: Response) => { await deleteHiringManagerOpening(req, res); }));
router.get("/openings/:id/profiles", ...auth, asyncHandler(async (req: Request, res: Response) => { await listHiringManagerProfiles(req, res); }));
router.get("/profiles/:id/preview", ...auth, asyncHandler(async (req: Request, res: Response) => { await previewManagerProfile(req, res); }));
router.post("/profiles/:id/reanalyze", ...auth, asyncHandler(async (req: Request, res: Response) => { await reanalyzeProfile(req, res); }));
router.post("/profiles/:id/shortlist", ...auth, asyncHandler(async (req: Request, res: Response) => { await shortlistProfile(req, res); }));
router.post("/profiles/:id/reject", ...auth, asyncHandler(async (req: Request, res: Response) => { await rejectProfile(req, res); }));

export default router;
