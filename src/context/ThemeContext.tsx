import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

// =====================================================
// COLORS
// =====================================================

export const lightColors = {
  background: "#F6F7FB",
  card: "#FFFFFF",

  text: "#171717",
  secondaryText: "#777777",
  mutedText: "#888888",

  border: "#E8E8E8",

  inputBackground: "#FAFAFA",
  iconBackground: "#F0F2F5",

  primary: "#2563EB",

  white: "#FFFFFF",
  black: "#171717",

  danger: "#DC2626",
  success: "#16A34A",
  warning: "#F59E0B",
};

// =====================================================
// DARK COLORS
// =====================================================

export const darkColors = {
  background: "#111827",
  card: "#1F2937",

  text: "#F9FAFB",
  secondaryText: "#D1D5DB",
  mutedText: "#9CA3AF",

  border: "#374151",

  inputBackground: "#111827",
  iconBackground: "#374151",

  primary: "#3B82F6",

  white: "#FFFFFF",
  black: "#000000",

  danger: "#F87171",
  success: "#4ADE80",
  warning: "#FBBF24",
};

// =====================================================
// COLOR TYPE
// =====================================================

export type ThemeColors =
  | typeof lightColors
  | typeof darkColors;

// =====================================================
// THEME TYPES
// =====================================================

interface ThemeContextType {
  isDarkMode: boolean;

  colors: ThemeColors;

  toggleDarkMode: () => Promise<void>;
}

// =====================================================
// CONTEXT
// =====================================================

const ThemeContext =
  createContext<ThemeContextType | undefined>(
    undefined
  );

// =====================================================
// PROVIDER
// =====================================================

export const ThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isDarkMode, setIsDarkMode] =
    useState(false);

  // ===================================================
  // LOAD SAVED THEME
  // ===================================================

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme =
        await AsyncStorage.getItem(
          "darkMode"
        );

      if (savedTheme === "true") {
        setIsDarkMode(true);
      } else {
        setIsDarkMode(false);
      }
    } catch (error) {
      console.log(
        "Error loading theme:",
        error
      );
    }
  };

  // ===================================================
  // TOGGLE DARK MODE
  // ===================================================

  const toggleDarkMode = async () => {
    try {
      const newValue = !isDarkMode;

      setIsDarkMode(newValue);

      await AsyncStorage.setItem(
        "darkMode",
        String(newValue)
      );
    } catch (error) {
      console.log(
        "Error saving theme:",
        error
      );
    }
  };

  // ===================================================
  // CURRENT COLORS
  // ===================================================

  const colors = isDarkMode
    ? darkColors
    : lightColors;

  // ===================================================
  // PROVIDER
  // ===================================================

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        colors,
        toggleDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// =====================================================
// HOOK
// =====================================================

export const useTheme = () => {
  const context =
    useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
};