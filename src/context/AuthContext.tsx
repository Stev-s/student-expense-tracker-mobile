
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import {
  loginUser,
  registerUser,
  updateProfileUser as updateProfileApi,
  uploadProfilePicture as uploadProfilePictureApi,
  changePasswordUser,
  User,
} from "../services/authService";

// =====================================================
// AUTH CONTEXT TYPE
// =====================================================

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;

  // DARK MODE
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => Promise<void>;

  // LOGIN
  login: (email: string, password: string) => Promise<void>;

  // REGISTER
  register: (
    full_name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<void>;

  // UPDATE PROFILE
  updateProfile: (data: {
    full_name: string;
    email: string;
    phone?: string;
  }) => Promise<User>;

  // UPLOAD PROFILE PICTURE
  uploadProfilePicture: (imageUri: string) => Promise<User>;

  // CHANGE PASSWORD
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;

  // LOGOUT
  logout: () => Promise<void>;
}

// =====================================================
// CREATE CONTEXT
// =====================================================

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// =====================================================
// AUTH PROVIDER
// =====================================================

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // DARK MODE STATE
  const [isDarkMode, setIsDarkModeState] = useState(false);

  // LOAD STORED AUTHENTICATION
  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }

      const storedDarkMode = await AsyncStorage.getItem("darkMode");

      if (storedDarkMode !== null) {
        setIsDarkModeState(storedDarkMode === "true");
      }
    } catch (error) {
      console.log("Error loading stored data:", error);
    } finally {
      setLoading(false);
    }
  };

  // IDLE AUTO-LOGOUT
  useEffect(() => {
    if (!token || typeof window === "undefined") return;

    const INACTIVITY_LIMIT = 10 * 60 * 1000;
    let logoutTimer: ReturnType<typeof setTimeout>;

    const handleLogout = async () => {
      try {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");

        setToken(null);
        setUser(null);

        window.location.href = "/login";
      } catch (error) {
        console.error("Logout error:", error);
      }
    };

    const resetTimer = () => {
      if (logoutTimer) clearTimeout(logoutTimer);

      logoutTimer = setTimeout(
        handleLogout,
        INACTIVITY_LIMIT
      );
    };

    const events = [
      "click",
      "keydown",
      "scroll",
      "touchstart",
      "mousemove",
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);

      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [token]);

  // =====================================================
  // SET DARK MODE
  // =====================================================

  const setIsDarkMode = async (value: boolean) => {
    try {
      setIsDarkModeState(value);

      await AsyncStorage.setItem(
        "darkMode",
        String(value)
      );
    } catch (error) {
      console.log("Error saving dark mode:", error);
    }
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const login = async (
    email: string,
    password: string
  ) => {
    const result = await loginUser({
      email,
      password,
    });

    if (result.token && result.user) {
      await AsyncStorage.setItem(
        "token",
        result.token
      );

      await AsyncStorage.setItem(
        "user",
        JSON.stringify(result.user)
      );

      setToken(result.token);
      setUser(result.user);
    } else {
      throw new Error(
        result.message || "Unable to log in."
      );
    }
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const register = async (
    full_name: string,
    email: string,
    password: string,
    phone?: string
  ) => {
    const result = await registerUser({
      full_name,
      email,
      password,
      phone,
    });

    if (!result.success) {
      throw new Error(
        result.message || "Unable to register."
      );
    }
  };

  // =====================================================
  // UPDATE PROFILE
  // =====================================================

  const updateProfile = async (data: {
    full_name: string;
    email: string;
    phone?: string;
  }): Promise<User> => {
    if (!token) {
      throw new Error("You are not logged in.");
    }

    const response = await updateProfileApi(
      data,
      token
    );

    if (!response.success) {
      throw new Error(
        response.message || "Unable to update your profile."
      );
    }

    const updatedUser: User = {
      ...user,
      ...response.user,
      ...data,
      id: response.user?.id || user?.id || 0,
      profile_picture: response.user?.profile_picture ??
        user?.profile_picture ??
        null,
    };

    setUser(updatedUser);

    await AsyncStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    return updatedUser;
  };

  // =====================================================
  // UPLOAD PROFILE PICTURE
  // =====================================================

  const uploadProfilePicture = async (
    imageUri: string
  ): Promise<User> => {
    if (!token) {
      throw new Error(
        "You are not logged in. Please log in again."
      );
    }

    if (!imageUri) {
      throw new Error(
        "Please select a picture first."
      );
    }

    const response = await uploadProfilePictureApi(
      imageUri,
      token
    );

    if (!response.success || !response.profile_picture) {
      throw new Error(
        response.message || "Unable to upload profile picture."
      );
    }

    const updatedUser: User = {
      ...user!,
      profile_picture: response.profile_picture,
    };

    setUser(updatedUser);

    await AsyncStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    return updatedUser;
  };

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    if (!token) {
      throw new Error(
        "You are not logged in. Please log in again."
      );
    }

    const response = await changePasswordUser(
      {
        currentPassword,
        newPassword,
      },
      token
    );

    if (!response.success) {
      throw new Error(
        response.message || "Unable to change your password."
      );
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      setToken(null);
      setUser(null);

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      } else {
        router.replace("/login");
      }
    } catch (error) {
      console.log("Logout error:", error);
      throw error;
    }
  };

  // =====================================================
  // PROVIDER
  // =====================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isDarkMode,
        setIsDarkMode,
        login,
        register,
        updateProfile,
        uploadProfilePicture,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// =====================================================
// USE AUTH
// =====================================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};
