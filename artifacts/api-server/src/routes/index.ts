import { Router, type IRouter } from "express";
import healthRouter from "./health";
import emergencyRouter from "./emergency";
import facilitiesRouter from "./facilities";

const router: IRouter = Router();

router.use(healthRouter);
router.use(emergencyRouter);
router.use(facilitiesRouter);

export default router;
