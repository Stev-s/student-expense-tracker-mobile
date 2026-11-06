
const API_URL = "https://interviews-elected-bay-employees.trycloudflare.com/api";

// =====================================================
// API REQUEST
// =====================================================

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  try {
    const isFormData =
      typeof FormData !== "undefined" &&
      options.body instanceof FormData;

    const headers: Record<string, string> = {
      ...(!isFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    // Do not manually set Content-Type for FormData.
    // Fetch must generate the multipart boundary automatically.

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const responseText = await response.text();

    let data: any = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error(
        "The server returned an invalid response. Please check your backend."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// =====================================================
// FULL PROFILE IMAGE URL
// =====================================================

export const getFullImageUrl = (
  imagePath?: string | null
): string | null => {
  if (!imagePath) return null;

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
  }

  const serverUrl = API_URL.replace(/\/api\/?$/, "");

  return `${serverUrl}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

// =====================================================
// EXPORT API URL
// =====================================================

export { API_URL };

export default API_URL;
