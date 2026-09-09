
export const Colors = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#F59E0B",

  background: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",

  text: "#0F172A",
  secondaryText: "#64748B",
  mutedText: "#94A3B8",

  darkBackground: "#0F172A",
  darkSurface: "#1E293B",
  darkBorder: "#334155",
  darkText: "#F8FAFC",
};

export const Radius = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
};

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};

export const Typography = {
  hero: {
    fontSize: 32,
    fontWeight: "800" as const,
  },

  title: {
    fontSize: 24,
    fontWeight: "700" as const,
  },

  section: {
    fontSize: 18,
    fontWeight: "700" as const,
  },

  body: {
    fontSize: 15,
    fontWeight: "400" as const,
  },

  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
};

export const Shadows = {
  card: {
    elevation: 5,

    shadowColor: "#000",

    shadowOpacity: 0.08,

    shadowRadius: 12,

    shadowOffset: {
      width: 0,
      height: 5,
    },
  },

  button: {
    elevation: 4,

    shadowColor: "#2563EB",

    shadowOpacity: 0.25,

    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
};