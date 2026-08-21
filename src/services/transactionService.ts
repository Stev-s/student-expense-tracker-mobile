import { apiRequest } from "./api";

// =====================================================
// TRANSACTION INTERFACE
// =====================================================

export interface Transaction {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  description?: string | null;
  transaction_date: string;
  category_name?: string;
  type?: "Income" | "Expense";
  created_at?: string;
}

// =====================================================
// CREATE / UPDATE TRANSACTION DATA
// =====================================================

export interface CreateTransactionData {
  category_id: number;

  // Used when the user selects the global "Other" category
  custom_category?: string;

  amount: number;

  description?: string;

  transaction_date: string;
}

// =====================================================
// TRANSACTION RESPONSE
// =====================================================

export interface TransactionResponse {
  success: boolean;
  message?: string;
  transaction?: Transaction;
}

// =====================================================
// TRANSACTIONS RESPONSE
// =====================================================

export interface TransactionsResponse {
  success: boolean;
  transactions: Transaction[];
  count?: number;
}

// =====================================================
// CREATE TRANSACTION
// =====================================================

export const createTransaction = async (
  token: string,
  data: CreateTransactionData
): Promise<TransactionResponse> => {
  return await apiRequest("/transactions", {
    method: "POST",

    headers: {
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify(data),
  });
};

// =====================================================
// GET ALL TRANSACTIONS
// =====================================================

export const getTransactions = async (
  token: string
): Promise<TransactionsResponse> => {
  return await apiRequest("/transactions", {
    method: "GET",

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// =====================================================
// GET SINGLE TRANSACTION
// =====================================================

export const getTransaction = async (
  token: string,
  id: number
): Promise<TransactionResponse> => {
  return await apiRequest(`/transactions/${id}`, {
    method: "GET",

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// =====================================================
// UPDATE TRANSACTION
// =====================================================

export const updateTransaction = async (
  token: string,
  id: number,
  data: CreateTransactionData
): Promise<TransactionResponse> => {
  return await apiRequest(`/transactions/${id}`, {
    method: "PUT",

    headers: {
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify(data),
  });
};

// =====================================================
// DELETE TRANSACTION
// =====================================================

export const deleteTransaction = async (
  token: string,
  id: number
): Promise<TransactionResponse> => {
  return await apiRequest(`/transactions/${id}`, {
    method: "DELETE",

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// =====================================================
// SEARCH & FILTER TRANSACTIONS
// =====================================================

export const searchTransactions = async (
  token: string,
  filters: {
    description?: string;
    category?: string;
    type?: "Income" | "Expense";
    startDate?: string;
    endDate?: string;
  }
): Promise<TransactionsResponse> => {
  const params = new URLSearchParams();

  // Description search
  if (filters.description) {
    params.append(
      "description",
      filters.description
    );
  }

  // Category filter
  if (filters.category) {
    params.append(
      "category",
      filters.category
    );
  }

  // Income / Expense filter
  if (filters.type) {
    params.append(
      "type",
      filters.type
    );
  }

  // Start date
  if (filters.startDate) {
    params.append(
      "startDate",
      filters.startDate
    );
  }

  // End date
  if (filters.endDate) {
    params.append(
      "endDate",
      filters.endDate
    );
  }

  const query = params.toString();

  return await apiRequest(
    `/transactions/search${
      query ? `?${query}` : ""
    }`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};