import React, { useEffect } from "react";

import {
  DarkTheme as RouterDarkTheme,
  DefaultTheme as RouterDefaultTheme,
  Stack,
  ThemeProvider as RouterThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";

import * as SplashScreen from "expo-splash-screen";

import {
  AuthProvider,
  useAuth,
} from "@/context/AuthContext";

import {
  ThemeProvider as AppThemeProvider,
  useTheme,
} from "@/context/ThemeContext";


// =====================================================
// KEEP SPLASH SCREEN VISIBLE WHILE AUTH LOADS
// =====================================================

SplashScreen.preventAutoHideAsync();


// =====================================================
// ROOT NAVIGATOR
// =====================================================

function RootNavigator() {

  const {
    token,
    loading,
  } = useAuth();

  const {
    isDarkMode,
  } = useTheme();

  const router = useRouter();

  const segments = useSegments();


  // ===================================================
  // ROUTER THEME
  // ===================================================

  const routerTheme =
    isDarkMode
      ? RouterDarkTheme
      : RouterDefaultTheme;


  // ===================================================
  // AUTHENTICATION NAVIGATION
  // ===================================================

  useEffect(() => {

    // -----------------------------------------------
    // DO NOTHING WHILE AUTHENTICATION IS LOADING
    // -----------------------------------------------

    if (loading) {
      return;
    }


    // -----------------------------------------------
    // CURRENT ROUTE
    // -----------------------------------------------

    const currentRoute =
      segments[0] || "";


    // =================================================
    // PUBLIC ROUTES
    // These routes can be accessed without login
    // =================================================

    const publicRoutes = [
      "login",
      "register",
      "forgot-password",
      "reset-password",
    ];


    const isPublicRoute =
      publicRoutes.includes(currentRoute);


    // =================================================
    // USER IS NOT LOGGED IN (CHECKING TOKEN)
    // =================================================

    if (!token) {

      // ------------------------------------------------
      // If user is on ANY protected page,
      // immediately send them to login.
      // ------------------------------------------------

      if (!isPublicRoute) {

        // Force a full page reload (Works 100% on Web)
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        } else {
          router.replace("/login"); // Native fallback
        }

      }

      return;
    }


    // =================================================
    // USER IS LOGGED IN
    // =================================================

    // -------------------------------------------------
    // Logged-in users should not remain on authentication
    // screens.
    // -------------------------------------------------

    if (isPublicRoute) {

      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        router.replace("/");
      }

    }

  }, [
    token,
    loading,
    segments,
    router,
  ]);


  // ===================================================
  // HIDE SPLASH SCREEN
  // ===================================================

  useEffect(() => {

    if (!loading) {

      SplashScreen.hideAsync();

    }

  }, [loading]);


  // ===================================================
  // WAIT FOR AUTHENTICATION
  // ===================================================

  if (loading) {

    return null;

  }


  // ===================================================
  // NAVIGATION
  // ===================================================

  return (

    <RouterThemeProvider
      value={routerTheme}
    >

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >

        {/* ============================================
            AUTHENTICATION SCREENS
            ============================================ */}

        <Stack.Screen
          name="login"
        />

        <Stack.Screen
          name="register"
        />

        <Stack.Screen
          name="forgot-password"
        />

        <Stack.Screen
          name="reset-password"
        />


        {/* ============================================
            MAIN APPLICATION SCREENS
            ============================================ */}

        <Stack.Screen
          name="index"
        />

        <Stack.Screen
          name="explore"
        />

        <Stack.Screen
          name="profile"
        />

        <Stack.Screen
          name="settings"
        />

        <Stack.Screen
          name="edit-profile"
        />

        <Stack.Screen
          name="change-password"
        />

        <Stack.Screen
          name="reports"
        />

        <Stack.Screen
          name="transactions"
        />

        <Stack.Screen
          name="add-transaction"
        />

        <Stack.Screen
          name="edit-transaction"
        />

        <Stack.Screen
          name="budget"
        />

      </Stack>

    </RouterThemeProvider>

  );

}


// =====================================================
// ROOT LAYOUT
// =====================================================

export default function RootLayout() {

  return (

    <AuthProvider>

      <AppThemeProvider>

        <RootNavigator />

      </AppThemeProvider>

    </AuthProvider>

  );

}