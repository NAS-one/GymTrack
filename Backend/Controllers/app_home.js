import { success, error } from "../Utils/responses.js";

export class AppHomeController {
    constructor({ AppHomeModel }) {
        this.AppHomeModel = AppHomeModel;
    }

    getMetrics = async (req, res) => {
        const { id_cliente } = req.params;
        try {
            const metrics = await this.DashboardModel.getClientMetrics({ id_cliente });
            success(req, res, metrics, 200);
        } catch (e) {
            console.error(e);
            error(req, res, "Error al obtener métricas del dashboard", 500);
        }
    };
}