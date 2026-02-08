/**
 * Color palette generation utility
 * Generates themed color palettes from a base color
 */

export interface ColorPalette {
  primary: string; // Base color
  primaryDark: string; // Darker shade (15% darker)
  primaryLight: string; // Lighter shade (15% lighter)
  cardBackground: string; // For card backgrounds (lighten 35%, desaturate 30%)
  cardHighlight: string; // For touch highlights (lighten 25%, desaturate 20%)
  iconBackground: string; // For icon containers (lighten 40%, desaturate 40%)
  textPrimary: string; // Primary text color (high contrast)
  textSecondary: string; // Secondary text color (medium contrast)
  textMuted: string; // Muted/hint text color (low contrast)
}

/**
 * Convert hex color to HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Lighten a color by a percentage (0-1)
 */
function lighten(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  hsl.l = Math.min(100, hsl.l + amount * 100);
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

/**
 * Darken a color by a percentage (0-1)
 */
function darken(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  hsl.l = Math.max(0, hsl.l - amount * 100);
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

/**
 * Desaturate a color by a percentage (0-1)
 */
function desaturate(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  hsl.s = Math.max(0, hsl.s - amount * 100);
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

/**
 * Generate a complete color palette from a base color
 * Returns both light and dark mode palettes
 */
export function generatePalette(baseColor: string): { light: ColorPalette; dark: ColorPalette } {
  // Light mode palette
  const lightPalette: ColorPalette = {
    primary: baseColor,
    primaryDark: darken(baseColor, 0.15),
    primaryLight: lighten(baseColor, 0.15),
    cardBackground: desaturate(lighten(baseColor, 0.35), 0.3),
    cardHighlight: desaturate(lighten(baseColor, 0.25), 0.2),
    iconBackground: desaturate(lighten(baseColor, 0.4), 0.4),
    textPrimary: '#1a1a1a', // Near-black for primary text
    textSecondary: '#4a4a4a', // Dark gray for secondary text
    textMuted: '#666666', // Medium gray for muted text
  };

  // Dark mode palette (adjust for dark backgrounds)
  const darkPalette: ColorPalette = {
    primary: baseColor,
    primaryDark: darken(baseColor, 0.2),
    primaryLight: lighten(baseColor, 0.1),
    cardBackground: desaturate(darken(baseColor, 0.3), 0.4),
    cardHighlight: desaturate(darken(baseColor, 0.2), 0.3),
    iconBackground: desaturate(darken(baseColor, 0.35), 0.5),
    textPrimary: '#f5f5f5', // Near-white for primary text
    textSecondary: '#b0b0b0', // Light gray for secondary text
    textMuted: '#808080', // Medium gray for muted text
  };

  return { light: lightPalette, dark: darkPalette };
}
