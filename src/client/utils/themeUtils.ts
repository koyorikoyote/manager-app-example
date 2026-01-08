import { ThemeConfiguration } from "../types/theme";
import { getThemeConfiguration } from "../config/themes";

export const applyCSSVariables = (themeConfig: ThemeConfiguration): void => {
  const root = document.documentElement;

  Object.entries(themeConfig.cssVariables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};

export const removeCSSVariables = (themeConfig: ThemeConfiguration): void => {
  const root = document.documentElement;

  Object.keys(themeConfig.cssVariables).forEach((property) => {
    root.style.removeProperty(property);
  });
};

export const applyTheme = (themeId: string): boolean => {
  const themeConfig = getThemeConfiguration(themeId);

  if (!themeConfig) {
    console.warn(`Theme configuration not found for: ${themeId}`);
    return false;
  }

  try {
    // Apply per-shade palette variables so Tailwind classes (e.g., bg-primary-500) update at runtime
    applyPaletteVariables(themeConfig);
    // Apply any additional cssVariables defined by the theme (base tokens)
    applyCSSVariables(themeConfig);

    // Store the current theme ID for reference
    document.documentElement.setAttribute("data-color-theme", themeId);

    return true;
  } catch (error) {
    console.error("Failed to apply theme:", error);
    return false;
  }
};

export const resetTheme = (): void => {
  const currentThemeId =
    document.documentElement.getAttribute("data-color-theme");

  if (currentThemeId) {
    const themeConfig = getThemeConfiguration(currentThemeId);
    if (themeConfig) {
      removeCSSVariables(themeConfig);
    }
  }

  document.documentElement.removeAttribute("data-color-theme");
};

export const getCurrentTheme = (): string | null => {
  return document.documentElement.getAttribute("data-color-theme");
};

export const previewTheme = (themeId: string): (() => void) | null => {
  const currentThemeId = getCurrentTheme();

  if (applyTheme(themeId)) {
    // Return a function to restore the previous theme
    return () => {
      if (currentThemeId) {
        applyTheme(currentThemeId);
      } else {
        resetTheme();
      }
    };
  }

  return null;
};

// Accessibility validation utilities
export const hexToRgb = (
  hex: string
): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Convert #rrggbb to "r g b" triplet for use with rgb(var(--...))
const hexToRgbTriplet = (hex: string): string | null => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return `${rgb.r} ${rgb.g} ${rgb.b}`;
};

// Apply per-shade palette variables like --primary-500 as RGB triplets
const applyPaletteVariables = (themeConfig: ThemeConfiguration): void => {
  const root = document.documentElement;

  // Define allowed palettes and shades with literal types for full type safety
  const palettes = ["primary", "secondary", "accent", "neutral"] as const;

  const shades = [
    "50",
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
  ] as const;

  for (const palette of palettes) {
    const paletteColors = themeConfig.colors[palette];
    for (const shade of shades) {
      const hex = paletteColors[shade];
      const triplet = hexToRgbTriplet(hex);
      if (triplet) {
        root.style.setProperty(`--${palette}-${shade}`, triplet);
      }
    }
  }

  // Convenience vars often referenced by custom CSS
  const bg = hexToRgbTriplet(themeConfig.colors.neutral["50"]);
  if (bg) root.style.setProperty(`--background`, bg);
  const fg = hexToRgbTriplet(themeConfig.colors.neutral["900"]);
  if (fg) root.style.setProperty(`--foreground`, fg);
};

export const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

export const validateThemeAccessibility = (
  themeConfig: ThemeConfiguration
): {
  isValid: boolean;
  issues: string[];
  results: Array<{
    combination: string;
    ratio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
  }>;
} => {
  const issues: string[] = [];
  const results: Array<{
    combination: string;
    ratio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
  }> = [];

  // Key color combinations to test
  const testCombinations = [
    {
      name: "Primary on Primary Foreground",
      bg: themeConfig.colors.primary[500],
      fg: "#ffffff", // primary-foreground is always white
    },
    {
      name: "Secondary on Secondary Foreground",
      bg: themeConfig.colors.secondary[500],
      fg: themeConfig.colors.primary[800], // secondary-foreground
    },
    {
      name: "Accent on Accent Foreground",
      bg: themeConfig.colors.accent[500],
      fg: themeConfig.colors.primary[900], // accent-foreground
    },
    {
      name: "Foreground on Background",
      bg: themeConfig.colors.primary[50], // background
      fg: themeConfig.colors.primary[800], // foreground
    },
    {
      name: "Card Foreground on Card",
      bg: themeConfig.colors.neutral[50], // card
      fg: themeConfig.colors.neutral[700], // card-foreground
    },
    {
      name: "Muted Foreground on Muted",
      bg: themeConfig.colors.neutral[100], // muted
      fg: themeConfig.colors.neutral[500], // muted-foreground
    },
  ];

  testCombinations.forEach(({ name, bg, fg }) => {
    const ratio = getContrastRatio(bg, fg);
    const wcagAA = ratio >= 4.5;
    const wcagAAA = ratio >= 7;

    results.push({
      combination: name,
      ratio: Math.round(ratio * 100) / 100,
      wcagAA,
      wcagAAA,
    });

    if (!wcagAA) {
      issues.push(
        `${name}: Contrast ratio ${ratio.toFixed(
          2
        )} fails WCAG AA (requires 4.5:1)`
      );
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
    results,
  };
};
