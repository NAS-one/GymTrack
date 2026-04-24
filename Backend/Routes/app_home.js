import { Router } from "express";
import { AppHomeController } from "../Controllers/app_home.js";

export const createAppHomeRouter = ({ AppHomeModel }) => {
    const router = Router();
    const controller = new AppHomeController({ AppHomeModel });

    router.get("/metrics/:id_cliente", controller.getMetrics);

    return router;
};