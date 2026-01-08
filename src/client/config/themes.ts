import { ThemeConfiguration, ThemeRegistry } from "../types/theme";

export const lightBeigeTheme: ThemeConfiguration = {
  id: "light-beige",
  name: "Light Beige",
  description: "Warm, professional theme with teal and orange accents",
  colors: {
    primary: {
      50: "#f0fdfa",
      100: "#ccfbf1",
      200: "#99f6e4",
      300: "#5eead4",
      400: "#2dd4bf",
      500: "#14b8a6",
      600: "#0d9488",
      700: "#0f766e",
      800: "#115e59",
      900: "#134e4a",
    },
    secondary: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      300: "#fdba74",
      400: "#fb923c",
      500: "#f97316",
      600: "#ea580c",
      700: "#c2410c",
      800: "#9a3412",
      900: "#7c2d12",
    },
    accent: {
      50: "#ecfeff",
      100: "#cffafe",
      200: "#a5f3fc",
      300: "#67e8f9",
      400: "#22d3ee",
      500: "#06b6d4",
      600: "#0891b2",
      700: "#0e7490",
      800: "#155e75",
      900: "#164e63",
    },
    neutral: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
    gradients: {
      primary: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
      secondary: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
      accent: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    },
  },
  cssVariables: {
    "--primary": "20 184 166", // primary-500 in RGB
    "--primary-foreground": "255 255 255",
    "--secondary": "249 115 22", // secondary-500 in RGB
    "--secondary-foreground": "255 255 255",
    "--accent": "6 182 212", // accent-500 in RGB
    "--accent-foreground": "255 255 255",
    "--background": "248 250 252", // neutral-50 in RGB
    "--foreground": "15 23 42", // neutral-900 in RGB
    "--card": "255 255 255",
    "--card-foreground": "15 23 42",
    "--popover": "255 255 255",
    "--popover-foreground": "15 23 42",
    "--muted": "241 245 249", // neutral-100 in RGB
    "--muted-foreground": "100 116 139", // neutral-500 in RGB
    "--border": "226 232 240", // neutral-200 in RGB
    "--input": "226 232 240",
    "--ring": "20 184 166", // primary-500 in RGB
  },
};

export const lightBlueTheme: ThemeConfiguration = {
  id: "light-blue",
  name: "Light Blue",
  description: "Modern blue-based theme inspired by contemporary web design",
  // Accessibility validated: All color combinations pass WCAG AA (4.5:1) contrast requirements
  colors: {
    primary: {
      50: "#f0f8ff", // Light blue background from reference
      100: "#e6f3ff", // Lighter blue
      200: "#bee3f8", // Blue-200 from reference
      300: "#90cdf4", // Blue-300 from reference
      400: "#4299e1", // Primary blue from reference
      500: "#2c5282", // Darker blue for better contrast (was #3182ce)
      600: "#2b6cb0", // Darker blue
      700: "#1e40af", // Even darker blue
      800: "#1a365d", // Foreground from reference
      900: "#234e52", // Accent foreground from reference
    },
    secondary: {
      50: "#e6fffa", // Accent light from reference
      100: "#b2f5ea", // Accent from reference
      200: "#81e6d9", // Teal variations
      300: "#4fd1c7",
      400: "#38b2ac",
      500: "#319795",
      600: "#2c7a7b",
      700: "#285e61",
      800: "#234e52",
      900: "#1d4044",
    },
    accent: {
      50: "#f0f8ff",
      100: "#e6f3ff",
      200: "#bee3f8",
      300: "#90cdf4",
      400: "#63b3ed", // Chart-2 from reference
      500: "#4299e1", // Chart-1 from reference
      600: "#3182ce",
      700: "#2c5282",
      800: "#2b6cb0",
      900: "#1a365d",
    },
    neutral: {
      50: "#f7fafc", // Card background from reference
      100: "#edf2f7", // Muted from reference
      200: "#e2e8f0",
      300: "#cbd5e0",
      400: "#a0aec0",
      500: "#4a5568", // Darker for better contrast (was #718096)
      600: "#2d3748",
      700: "#1a202c", // Card foreground from reference
      800: "#171923",
      900: "#0f172a",
    },
    gradients: {
      primary: "linear-gradient(135deg, #4299e1 0%, #3182ce 100%)", // Primary from reference
      secondary: "linear-gradient(135deg, #bee3f8 0%, #90cdf4 100%)", // Secondary from reference
      accent: "linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%)", // Accent from reference
    },
  },
  cssVariables: {
    "--primary": "44 82 130", // #2c5282 in RGB (darker for better contrast)
    "--primary-foreground": "255 255 255",
    "--secondary": "190 227 248", // #bee3f8 in RGB
    "--secondary-foreground": "44 82 130", // #2c5282 in RGB
    "--accent": "230 255 250", // #e6fffa in RGB
    "--accent-foreground": "35 78 82", // #234e52 in RGB
    "--background": "240 248 255", // #f0f8ff in RGB
    "--foreground": "26 54 93", // #1a365d in RGB
    "--card": "247 250 252", // #f7fafc in RGB
    "--card-foreground": "26 32 44", // #1a202c in RGB (darker for better contrast)
    "--popover": "255 255 255",
    "--popover-foreground": "26 32 44",
    "--muted": "237 242 247", // #edf2f7 in RGB
    "--muted-foreground": "74 85 104", // #4a5568 in RGB (darker for better contrast)
    "--border": "190 227 248", // #bee3f8 with transparency in reference
    "--input": "255 255 255",
    "--ring": "44 82 130", // #2c5282 in RGB (updated to match primary)
  },
};

export const lightSilverTheme: ThemeConfiguration = {
  id: "light-silver",
  name: "Light Silver",
  description: "Elegant metallic silver design with gradient sheen and sophisticated dark gray typography",
  colors: {
    primary: {
      50: "#f7f8f9",
      100: "#eef0f2",
      200: "#dde1e5",
      300: "#c8ced4",
      400: "#a8b0b8",
      500: "#8a939d",
      600: "#6d7782",
      700: "#525a65",
      800: "#3a4148",
      900: "#252a30",
    },
    secondary: {
      50: "#f7f8f9",
      100: "#eef0f2",
      200: "#dde1e5",
      300: "#c8ced4",
      400: "#a8b0b8",
      500: "#8a939d",
      600: "#6d7782",
      700: "#525a65",
      800: "#3a4148",
      900: "#252a30",
    },
    accent: {
      50: "#f7f8f9",
      100: "#eef0f2",
      200: "#dde1e5",
      300: "#c8ced4",
      400: "#a8b0b8",
      500: "#8a939d",
      600: "#6d7782",
      700: "#525a65",
      800: "#3a4148",
      900: "#252a30",
    },
    neutral: {
      50: "#ffffff",
      100: "#f7f8f9",
      200: "#eef0f2",
      300: "#dde1e5",
      400: "#c8ced4",
      500: "#a8b0b8",
      600: "#8a939d",
      700: "#6d7782",
      800: "#525a65",
      900: "#3a4148",
    },
    gradients: {
      primary: "linear-gradient(135deg, #8a939d 0%, #6d7782 50%, #8a939d 100%)",
      secondary: "linear-gradient(135deg, #eef0f2 0%, #dde1e5 50%, #eef0f2 100%)",
      accent: "linear-gradient(135deg, #c8ced4 0%, #a8b0b8 50%, #c8ced4 100%)",
    },
  },
  cssVariables: {
    "--primary": "109 119 130", // #6d7782 in RGB for darker metallic silver primary
    "--primary-foreground": "255 255 255",
    "--secondary": "238 240 242", // #eef0f2 in RGB for very light secondary
    "--secondary-foreground": "82 90 101", // #525a65 for dark gray text
    "--accent": "221 225 229", // #dde1e5 in RGB for subtle accent
    "--accent-foreground": "82 90 101", // #525a65 for dark gray text
    "--background": "255 255 255", // pure white background
    "--foreground": "82 90 101", // #525a65 for main text (dark gray for headers like 'Crew Management')
    "--card": "255 255 255", // pure white cards
    "--card-foreground": "82 90 101", // #525a65 for card text (dark gray)
    "--popover": "255 255 255",
    "--popover-foreground": "82 90 101",
    "--muted": "247 248 249", // #f7f8f9 in RGB for very light muted areas
    "--muted-foreground": "138 147 157", // #8a939d in RGB for muted text
    "--border": "238 240 242", // #eef0f2 in RGB for very light borders
    "--input": "255 255 255", // white input backgrounds
    "--ring": "109 119 130", // #6d7782 in RGB for focus rings
  },
};

export const glassBlueTheme: ThemeConfiguration = {
  id: "glass-blue",
  name: "Glass Blue",
  description: "Modern glassmorphism design with blue gradients and frosted glass effects",
  colors: {
    primary: {
      50: "#eff6ff",
      100: "#dbeafe", 
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
    },
    secondary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc", 
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
    },
    accent: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
    neutral: {
      50: "#ffffff",
      100: "#f8fafc",
      200: "#f1f5f9", 
      300: "#e2e8f0",
      400: "#cbd5e1",
      500: "#94a3b8",
      600: "#64748b",
      700: "#475569",
      800: "#334155",
      900: "#1e293b",
    },
    gradients: {
      primary: "radial-gradient(ellipse at center, #3b82f6 0%, #1d4ed8 100%)",
      secondary: "radial-gradient(ellipse at center, #0ea5e9 0%, #0284c7 100%)",
      accent: "radial-gradient(ellipse at center, #64748b 0%, #475569 100%)",
    },
  },
  cssVariables: {
    "--primary": "59 130 246", // #3b82f6 in RGB for glass blue primary
    "--primary-foreground": "255 255 255",
    "--secondary": "14 165 233", // #0ea5e9 in RGB for cyan secondary
    "--secondary-foreground": "255 255 255",
    "--accent": "100 116 139", // #64748b in RGB for slate accent
    "--accent-foreground": "255 255 255",
    "--background": "255 255 255", // white background for glass effect
    "--foreground": "30 41 59", // #1e293b for main text
    "--card": "255 255 255", // white cards with glass effect
    "--card-foreground": "30 41 59",
    "--popover": "255 255 255",
    "--popover-foreground": "30 41 59",
    "--muted": "248 250 252", // #f8fafc for muted areas
    "--muted-foreground": "100 116 139",
    "--border": "226 232 240", // #e2e8f0 for glass borders
    "--input": "255 255 255",
    "--ring": "59 130 246", // #3b82f6 for focus rings
  },
};

export const themeRegistry: ThemeRegistry = {
  "light-beige": lightBeigeTheme,
  "light-blue": lightBlueTheme,
  "light-silver": lightSilverTheme,
  "glass-blue": glassBlueTheme,
};

export const getThemeConfiguration = (
  themeId: string
): ThemeConfiguration | null => {
  return themeRegistry[themeId] || null;
};

export const getAvailableThemes = (): ThemeConfiguration[] => {
  return Object.values(themeRegistry);
};

export const validateThemeConfiguration = (
  config: unknown
): config is ThemeConfiguration => {
  if (!config || typeof config !== "object") {
    return false;
  }

  const obj = config as Record<string, unknown>;

  return (
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.description === "string" &&
    obj.colors !== undefined &&
    typeof obj.colors === "object" &&
    obj.colors !== null &&
    "primary" in obj.colors &&
    "secondary" in obj.colors &&
    "accent" in obj.colors &&
    "neutral" in obj.colors &&
    "gradients" in obj.colors &&
    obj.cssVariables !== undefined &&
    typeof obj.cssVariables === "object"
  );
};
