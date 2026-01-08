export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface GradientConfiguration {
  primary: string;
  secondary: string;
  accent: string;
}

export interface ThemeConfiguration {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: ColorPalette;
    secondary: ColorPalette;
    accent: ColorPalette;
    neutral: ColorPalette;
    gradients: GradientConfiguration;
  };
  cssVariables: Record<string, string>;
}

export interface ThemeRegistry {
  [key: string]: ThemeConfiguration;
}
