import { success, error } from "../Utils/responses.js";

export class DashboardController {
  constructor({ DashboardModel }) {
    this.DashboardModel = DashboardModel;
  }

  getSummary = async (req, res) => {
    try {
      const data = await this.DashboardModel.getSummary();
      // Aseguramos estructura estándar { body: ... }
      success(req, res, { body: data }, 200);
    } catch (e) {
      console.error("Error Dashboard Controller:", e);
      error(req, res, "Error al cargar dashboard", 500);
    }
  };
}