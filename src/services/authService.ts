import { apiRequest } from "./api";


// =====================================================
// REGISTER
// =====================================================

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}



// =====================================================
// LOGIN
// =====================================================

export interface LoginData {
  email: string;
  password: string;
}



// =====================================================
// USER
// =====================================================

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
}



// =====================================================
// AUTH RESPONSE
// =====================================================

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}



// =====================================================
// REGISTER USER
// =====================================================

export const registerUser = async (
  data: RegisterData
): Promise<AuthResponse> => {

  return await apiRequest("/auth/register", {

    method: "POST",

    body: JSON.stringify(data),

  });

};



// =====================================================
// LOGIN USER
// =====================================================

export const loginUser = async (
  data: LoginData
): Promise<AuthResponse> => {

  return await apiRequest("/auth/login", {

    method: "POST",

    body: JSON.stringify(data),

  });

};



// =====================================================
// UPDATE PROFILE
// =====================================================

export interface UpdateProfileData {
  full_name: string;
  email: string;
  phone?: string;
}


export const updateProfileUser = async (
  data: UpdateProfileData,
  token: string
): Promise<AuthResponse> => {

  return await apiRequest("/auth/profile", {

    method: "PUT",

    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify(data),

  });

};



// =====================================================
// CHANGE PASSWORD
// =====================================================

export interface ChangePasswordData {

  currentPassword: string;

  newPassword: string;

}


export const changePasswordUser = async (
  data: ChangePasswordData,
  token: string
): Promise<AuthResponse> => {

  return await apiRequest(
    "/auth/change-password",
    {

      method: "PUT",

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),

    }
  );

};