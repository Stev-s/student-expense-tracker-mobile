import { apiRequest } from "./api";

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalTransactions: number;
}

export interface DashboardResponse {
  success: boolean;
  summary: DashboardSummary;
}

export const getDashboardSummary = async (
  token: string
): Promise<DashboardResponse> => {
  return await apiRequest("/dashboard", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};