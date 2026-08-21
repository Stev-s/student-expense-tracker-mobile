import { apiRequest } from "./api";

// =====================================================
// CATEGORY INTERFACE
// =====================================================

export interface Category {
  id: number;
  user_id?: number | null;
  category_name: string;
  type: "Income" | "Expense";
}

// =====================================================
// CATEGORIES RESPONSE
// =====================================================

export interface CategoriesResponse {
  success: boolean;
  categories: Category[];
}

// =====================================================
// GET ALL AVAILABLE CATEGORIES
// =====================================================

export const getCategories = async (
  token: string
): Promise<CategoriesResponse> => {
  return await apiRequest("/categories", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};