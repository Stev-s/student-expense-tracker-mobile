
import { apiRequest } from "./api";
import { Platform } from "react-native";

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
  profile_picture?: string | null;
}

// =====================================================
// AUTH RESPONSE
// =====================================================

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  profile_picture?: string;
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
    },
    body: JSON.stringify(data),
  });
};

// =====================================================
// UPLOAD PROFILE PICTURE
// Supports Web, Android and iOS
// =====================================================

export const uploadProfilePicture = async (
  imageUri: string,
  token: string
): Promise<AuthResponse> => {
  if (!imageUri) {
    throw new Error("Please select a profile picture.");
  }

  if (!token) {
    throw new Error("You are not logged in. Please log in again.");
  }

  const formData = new FormData();

  const filename = `profile-picture-${Date.now()}.jpg`;

  if (Platform.OS === "web") {
    // WEB: Convert the selected image into a Blob
    const imageResponse = await fetch(imageUri);

    if (!imageResponse.ok) {
      throw new Error("Unable to read the selected picture.");
    }

    const imageBlob = await imageResponse.blob();

    if (!imageBlob.size) {
      throw new Error("The selected picture is empty.");
    }

    formData.append(
      "profile_picture",
      imageBlob,
      filename
    );
  } else {
    // ANDROID / IOS: Use the local file URI
    formData.append(
      "profile_picture",
      {
        uri: imageUri,
        name: filename,
        type: "image/jpeg",
      } as any
    );
  }

  return await apiRequest("/auth/profile-picture", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
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
  return await apiRequest("/auth/change-password", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
};
