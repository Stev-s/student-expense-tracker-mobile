import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

// ADD THIS IMPORT
import { router } from "expo-router";

import {
  loginUser,
  registerUser,
  updateProfileUser as updateProfileApi,
  User,
} from "../services/authService";


// =====================================================
// AUTH CONTEXT TYPE
// =====================================================

interface AuthContextType {

  user: User | null;

  token: string | null;

  loading: boolean;

  // ===================================================
  // DARK MODE
  // ===================================================

  isDarkMode: boolean;

  setIsDarkMode: (
    value: boolean
  ) => Promise<void>;


  // ===================================================
  // LOGIN
  // ===================================================

  login: (
    email: string,
    password: string
  ) => Promise<void>;


  // ===================================================
  // REGISTER
  // ===================================================

  register: (
    full_name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<void>;


  // ===================================================
  // UPDATE PROFILE
  // ===================================================

  updateProfile: (
    data: {
      full_name: string;
      email: string;
      phone?: string;
    }
  ) => Promise<User>;


  // ===================================================
  // LOGOUT
  // ===================================================

  logout: () => Promise<void>;
}


// =====================================================
// CREATE CONTEXT
// =====================================================

const AuthContext =
  createContext<AuthContextType | undefined>(
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

  const [user, setUser] =
    useState<User | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);


  // ===================================================
  // DARK MODE STATE
  // ===================================================

  const [isDarkMode, setIsDarkModeState] =
    useState(false);


  // ===================================================
  // LOAD STORED AUTHENTICATION
  // ===================================================

  useEffect(() => {

    loadStoredData();

  }, []);


  // ===================================================
  // LOAD STORED DATA
  // ===================================================

  const loadStoredData = async () => {

    try {

      // -----------------------------------------------
      // LOAD TOKEN
      // -----------------------------------------------

      const storedToken =
        await AsyncStorage.getItem("token");


      // -----------------------------------------------
      // LOAD USER
      // -----------------------------------------------

      const storedUser =
        await AsyncStorage.getItem("user");


      if (
        storedToken &&
        storedUser
      ) {

        setToken(storedToken);

        setUser(
          JSON.parse(storedUser)
        );

      }


      // -----------------------------------------------
      // LOAD DARK MODE
      // -----------------------------------------------

      const storedDarkMode =
        await AsyncStorage.getItem(
          "darkMode"
        );


      if (
        storedDarkMode !== null
      ) {

        setIsDarkModeState(
          storedDarkMode === "true"
        );

      }

    } catch (error) {

      console.log(
        "Error loading stored data:",
        error
      );

    } finally {

      setLoading(false);

    }

  };


  // ===================================================
  // SET DARK MODE
  // ===================================================

  const setIsDarkMode = async (
    value: boolean
  ) => {

    try {

      // Update immediately
      setIsDarkModeState(value);


      // Save preference
      await AsyncStorage.setItem(
        "darkMode",
        String(value)
      );

    } catch (error) {

      console.log(
        "Error saving dark mode:",
        error
      );

    }

  };


  // ===================================================
  // LOGIN
  // ===================================================

  const login = async (
    email: string,
    password: string
  ) => {

    const result =
      await loginUser({
        email,
        password,
      });


    if (
      result.token &&
      result.user
    ) {

      // ---------------------------------------------
      // SAVE TOKEN
      // ---------------------------------------------

      await AsyncStorage.setItem(
        "token",
        result.token
      );


      // ---------------------------------------------
      // SAVE USER
      // ---------------------------------------------

      await AsyncStorage.setItem(
        "user",
        JSON.stringify(result.user)
      );


      // ---------------------------------------------
      // UPDATE STATE
      // ---------------------------------------------

      setToken(result.token);

      setUser(result.user);

    }

  };


  // ===================================================
  // REGISTER
  // ===================================================

  const register = async (
    full_name: string,
    email: string,
    password: string,
    phone?: string
  ) => {

    await registerUser({
      full_name,
      email,
      password,
      phone,
    });

  };


  // ===================================================
  // UPDATE PROFILE
  // ===================================================

  const updateProfile = async (
    data: {
      full_name: string;
      email: string;
      phone?: string;
    }
  ): Promise<User> => {

    // -----------------------------------------------
    // CHECK LOGIN
    // -----------------------------------------------

    if (!token) {

      throw new Error(
        "You are not logged in."
      );

    }


    // -----------------------------------------------
    // SEND UPDATE TO BACKEND
    // -----------------------------------------------

    const response =
      await updateProfileApi(
        data,
        token
      );


    // -----------------------------------------------
    // CHECK RESPONSE
    // -----------------------------------------------

    if (!response.success) {

      throw new Error(
        response.message ||
        "Unable to update your profile."
      );

    }


    // -----------------------------------------------
    // GET UPDATED USER
    // -----------------------------------------------

    const updatedUser =
      response.user ||
      {
        id: user?.id || 0,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
      };


    // -----------------------------------------------
    // UPDATE STATE
    // -----------------------------------------------

    setUser(updatedUser);


    // -----------------------------------------------
    // UPDATE STORED USER
    // -----------------------------------------------

    await AsyncStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );


    return updatedUser;

  };


  // ===================================================
  // LOGOUT
  // ===================================================

  const logout = async () => {

    try {

      // ---------------------------------------------
      // REMOVE TOKEN
      // ---------------------------------------------

      await AsyncStorage.removeItem(
        "token"
      );


      // ---------------------------------------------
      // REMOVE USER
      // ---------------------------------------------

      await AsyncStorage.removeItem(
        "user"
      );


      // ---------------------------------------------
      // UPDATE STATE
      // ---------------------------------------------

      setToken(null);

      setUser(null);


      // ---------------------------------------------
      // REDIRECT TO LOGIN PAGE
      // ---------------------------------------------

      router.replace("/login");

    } catch (error) {

      console.log(
        "Logout error:",
        error
      );

      throw error;

    }

  };


  // ===================================================
  // PROVIDER
  // ===================================================

  return (

    <AuthContext.Provider
      value={{

        user,

        token,

        loading,


        // Dark mode
        isDarkMode,

        setIsDarkMode,


        // Authentication
        login,

        register,

        updateProfile,

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

  const context =
    useContext(AuthContext);


  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );

  }


  return context;

};