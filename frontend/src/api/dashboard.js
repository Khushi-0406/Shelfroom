import api from "./api";

export const getDashboardStats = () => {
  return api.get("/dashboard/stats");
};

export const getDashboardOverview = () => {
  return api.get("/dashboard/overview");
};