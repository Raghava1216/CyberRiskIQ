import { Router, type IRouter } from "express";
import healthRouter from "./health";
import threatFeedsRouter from "./threat-feeds";
import wazuhRouter from "./wazuh";

const router: IRouter = Router();

router.use(healthRouter);
router.use(threatFeedsRouter);
router.use(wazuhRouter);

export default router;
