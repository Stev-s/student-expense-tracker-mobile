import { apiRequest } from "./api";

// =====================================================
// BUDGET INTERFACE
// =====================================================

export interface Budget {
  id: number;
  user_id: number;
  month: string;
  year: number;
  budget_amount: number;
  created_at?: string;
}

// =====================================================
// CREATE / UPDATE DATA
// =====================================================

export interface BudgetData {
  month: string;
  year: number;
  budget_amount: number;
}

// =====================================================
// SINGLE BUDGET RESPONSE
// =====================================================

export interface BudgetResponse {
  success: boolean;
  message?: string;
  budget?: Budget;
}

// =====================================================
// MULTIPLE BUDGETS RESPONSE
// =====================================================

export interface BudgetsResponse {
  success: boolean;
  budgets: Budget[];
  count?: number;
}

// =====================================================
// CREATE BUDGET
// =====================================================

export const createBudget = async (
  token: string,
  data: BudgetData
): Promise<BudgetResponse> => {
  return await apiRequest("/budgets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
};

// =====================================================
// GET ALL BUDGETS
// =====================================================

export const getBudgets = async (
  token: string
): Promise<BudgetsResponse> => {
  return await apiRequest("/budgets", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// =====================================================
// GET SINGLE BUDGET
// =====================================================

export const getBudget = async (
  token: string,
  id: number
): Promise<BudgetResponse> => {
  return await apiRequest(`/budgets/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// =====================================================
// UPDATE BUDGET
// =====================================================

export const updateBudget = async (
  token: string,
  id: number,
  data: BudgetData
): Promise<BudgetResponse> => {
  return await apiRequest(`/budgets/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
};

// =====================================================
// DELETE BUDGET
// =====================================================

export const deleteBudget = async (
  token: string,
  id: number
): Promise<BudgetResponse> => {
  return await apiRequest(`/budgets/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};