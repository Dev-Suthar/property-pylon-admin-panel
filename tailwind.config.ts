import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import twColors from "tailwindcss/colors";

/**
 * Theme-aware palette.
 *
 * Pages use raw Tailwind colour classes (bg-white, text-slate-500,
 * from-blue-600 …). Every such family is redirected to a CSS variable so the
 * same markup renders:
 *   - light: the stock Tailwind colours (unchanged look), rounded shapes;
 *   - dark (default): the CRED / NeoPOP language — pure black, monochrome
 *     greys, one cream accent, muted status colours, sharp 4px corners.
 * The mode lives on <html data-theme="dark|light"> (see index.html and
 * src/lib/theme.ts). Keep this in sync with the mobile app's src/theme.
 */

const SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] as const;
type Shade = (typeof SHADES)[number];
type Scale = Record<Shade, string>;

const NEUTRALS = ["slate", "gray", "zinc", "neutral", "stone"] as const;
const ACCENTS = ["blue", "indigo", "purple", "violet", "sky", "cyan", "fuchsia", "pink"] as const;
const STATUS = ["green", "emerald", "teal", "lime", "red", "rose", "amber", "yellow", "orange"] as const;
const FAMILIES = [...NEUTRALS, ...ACCENTS, ...STATUS];

const CARD = "#0F0F0F";
const CREAM = "#FFFBF0";

const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const triplet = (hex: string) => hexToRgb(hex).join(" ");
/** Blend `hex` over `base` at `amount` (0–1). */
const mix = (hex: string, base: string, amount: number) => {
  const a = hexToRgb(hex);
  const b = hexToRgb(base);
  return a.map((v, i) => Math.round(v * amount + b[i] * (1 - amount))).join(" ");
};

// Mirrored greyscale: light shades become dark surfaces, dark shades become text.
const DARK_NEUTRAL: Scale = {
  "50": "#0A0A0A", "100": "#141414", "200": "#1F1F1F", "300": "#2E2E2E", "400": "#6E6E6E",
  "500": "#8C8C8C", "600": "#A8A8A8", "700": "#C9C9C9", "800": "#E6E6E6", "900": "#F5F5F5", "950": "#FFFFFF",
};
// Every brand hue collapses to the single cream accent.
const DARK_ACCENT: Scale = {
  "50": "#14130F", "100": "#1C1B17", "200": "#2A2823", "300": "#5C594F", "400": "#C4BFB0",
  "500": CREAM, "600": CREAM, "700": CREAM, "800": CREAM, "900": CREAM, "950": CREAM,
};

const darkVars = (family: (typeof FAMILIES)[number]): Record<string, string> => {
  const vars: Record<string, string> = {};
  if ((NEUTRALS as readonly string[]).includes(family)) {
    SHADES.forEach((s) => (vars[`--tw-${family}-${s}`] = triplet(DARK_NEUTRAL[s])));
  } else if ((ACCENTS as readonly string[]).includes(family)) {
    SHADES.forEach((s) => (vars[`--tw-${family}-${s}`] = triplet(DARK_ACCENT[s])));
  } else {
    // Status hues: tinted surfaces for the light shades, bright text for the dark ones.
    const c = (twColors as any)[family] as Scale;
    const map: Record<Shade, string> = {
      "50": mix(c["500"], CARD, 0.1), "100": mix(c["500"], CARD, 0.16), "200": mix(c["500"], CARD, 0.28),
      "300": mix(c["500"], CARD, 0.5), "400": triplet(c["400"]), "500": triplet(c["400"]), "600": triplet(c["400"]),
      "700": triplet(c["300"]), "800": triplet(c["200"]), "900": triplet(c["100"]), "950": triplet(c["50"]),
    };
    SHADES.forEach((s) => (vars[`--tw-${family}-${s}`] = map[s]));
  }
  return vars;
};

const lightVars = () => {
  const vars: Record<string, string> = { "--tw-white": "255 255 255" };
  FAMILIES.forEach((f) => SHADES.forEach((s) => (vars[`--tw-${f}-${s}`] = triplet((twColors as any)[f][s]))));
  return vars;
};

const scale = (family: string) =>
  Object.fromEntries(SHADES.map((s) => [s, `rgb(var(--tw-${family}-${s}) / <alpha-value>)`]));

// Rounded in light, sharp in CRED dark.
const RADII = {
  light: { sm: "0.125rem", DEFAULT: "0.25rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem" },
  dark: { sm: "2px", DEFAULT: "3px", md: "4px", lg: "4px", xl: "4px", "2xl": "4px", "3xl": "4px" },
};
const radiusVars = (r: Record<string, string>) =>
  Object.fromEntries(Object.entries(r).map(([k, v]) => [`--r-${k === "DEFAULT" ? "base" : k}`, v]));

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: Object.fromEntries(
        Object.keys(RADII.light).map((k) => [k, `var(--r-${k === "DEFAULT" ? "base" : k})`]),
      ),
      colors: {
        white: "rgb(var(--tw-white) / <alpha-value>)",
        ...Object.fromEntries(FAMILIES.map((f) => [f, scale(f)])),
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(({ addBase }) => {
      const dark: Record<string, string> = { "--tw-white": triplet(CARD), ...radiusVars(RADII.dark) };
      FAMILIES.forEach((f) => Object.assign(dark, darkVars(f)));
      addBase({
        ":root": { ...lightVars(), ...radiusVars(RADII.light) },
        '[data-theme="dark"]': dark,
      });
    }),
  ],
} satisfies Config;
