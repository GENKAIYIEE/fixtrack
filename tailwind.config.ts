import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface-container-highest": "#e3e1e9",
        "on-secondary": "#ffffff",
        "on-primary": "#ffffff",
        "surface-dim": "#dad9e1",
        "surface-container-lowest": "#ffffff",
        "on-secondary-container": "#fefcff",
        "inverse-on-surface": "#f1f0f7",
        "surface-tint": "#4059aa",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#6e2c00",
        "surface": "#faf8ff",
        "on-surface-variant": "#444651",
        "on-primary-container": "#90a8ff",
        "primary-fixed": "#dce1ff",
        "on-error": "#ffffff",
        "on-primary-fixed": "#00164e",
        "tertiary": "#4b1c00",
        "inverse-surface": "#2f3036",
        "secondary-container": "#316bf3",
        "on-background": "#1a1b21",
        "outline": "#757682",
        "secondary-fixed": "#dbe1ff",
        "secondary-fixed-dim": "#b4c5ff",
        "on-surface": "#1a1b21",
        "on-secondary-fixed": "#00174b",
        "surface-variant": "#e3e1e9",
        "surface-container-low": "#f4f3fa",
        "inverse-primary": "#b6c4ff",
        "background": "#faf8ff",
        "surface-container-high": "#e9e7ef",
        "on-error-container": "#93000a",
        "primary-container": "#1e3a8a",
        "surface-bright": "#faf8ff",
        "primary": "#00236f",
        "surface-container": "#eeedf4",
        "outline-variant": "#c5c5d3",
        "primary-fixed-dim": "#b6c4ff",
        "error-container": "#ffdad6",
        "secondary": "#0051d5",
        "error": "#ba1a1a",
        "on-primary-fixed-variant": "#264191"
      },
      fontSize: {
        "label-md": ["14px", { lineHeight: "1", fontWeight: "500" }],
        "sidebar-label": ["11px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
        "table-header": ["13px", { lineHeight: "1", letterSpacing: "0.03em", fontWeight: "600" }],
        "body": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "h1": ["32px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "h2": ["24px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "700" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "kpi-value": ["28px", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "700" }]
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        body: ['Inter'],
        h1: ['Inter'],
        h2: ['Inter']
      }
    },
  },
  plugins: [],
};

export default config;
