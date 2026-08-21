const API_URL = "https://student-expense-tracker-backend-production.up.railway.app/api";

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export default API_URL;