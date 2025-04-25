import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./containers/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "1920px",
      "4xl": "2560px",
    },
    extend: {
      colors: {
        jade: {
          "50": "#eefff5",
          "100": "#d8ffec",
          "200": "#b4fed9",
          "300": "#79fcbb",
          "400": "#38f096",
          "500": "#0ed977",
          "600": "#05b45f",
          "700": "#088d4d",
          "800": "#0c6f40",
          "900": "#0c5b37",
          "950": "#004225",
        },
        azure: {
          "50": "#f0f8ff",
          "100": "#e0effe",
          "200": "#bbe0fc",
          "300": "#61baf9",
          "400": "#3babf5",
          "500": "#1190e6",
          "600": "#0571c4",
          "700": "#055a9f",
          "800": "#094d83",
          "900": "#0d416d",
          "950": "#092948",
        },
        violet: {
          "50": "#F1EEFF",
          "100": "#E6E1FF",
          "200": "#D2CBFF",
          "300": "#B7ACFF",
          "400": "#9C8CFF",
          "500": "#8470FF",
          "600": "#755FF8",
          "700": "#5D47DE",
          "800": "#4634B1",
          "900": "#2F227C",
          "950": "#1C1357",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",
        primary: {
          lighter: "rgb(var(--primary-lighter) / <alpha-value>)",
          DEFAULT: "hsl(var(--primary))",
          dark: "rgb(var(--primary-dark) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          lighter: "rgb(var(--secondary-lighter) / <alpha-value>)",
          DEFAULT: "hsl(var(--secondary))",
          dark: "rgb(var(--secondary-dark) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground))",
        },
        red: {
          lighter: "rgb(var(--red-lighter) / <alpha-value>)",
          DEFAULT: "rgb(var(--red-default) / <alpha-value>)",
          dark: "rgb(var(--red-dark) / <alpha-value>)",
        },
        orange: {
          lighter: "rgb(var(--orange-lighter) / <alpha-value>)",
          DEFAULT: "rgb(var(--orange-default) / <alpha-value>)",
          dark: "rgb(var(--orange-dark) / <alpha-value>)",
        },
        blue: {
          lighter: "rgb(var(--blue-lighter) / <alpha-value>)",
          DEFAULT: "rgb(var(--blue-default) / <alpha-value>)",
          dark: "rgb(var(--blue-dark) / <alpha-value>)",
        },
        green: {
          lighter: "rgb(var(--green-lighter) / <alpha-value>)",
          DEFAULT: "rgb(var(--green-default) / <alpha-value>)",
          dark: "rgb(var(--green-dark) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
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
      fontFamily: {
        inter: ["var(--font-inter)"],
      },
      animation: {
        blink: "blink 1.4s infinite both;",
        "scale-up": "scaleUp 500ms infinite alternate",
        "spin-slow": "spin 4s linear infinite",
        popup: "popup 500ms var(--popup-delay, 0ms) linear 1",
        skeleton: "skeletonWave 1.6s linear 0.5s infinite",
        "spinner-ease-spin": "spinnerSpin 0.8s ease infinite",
        "spinner-linear-spin": "spinnerSpin 0.8s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      backgroundImage: {
        skeleton: "`linear-gradient(90deg,transparent,#ecebeb,transparent)`",
        "skeleton-dark":
          "`linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)`",
      },
      keyframes: {
        blink: {
          "0%": {
            opacity: "0.2",
          },
          "20%": {
            opacity: "1",
          },
          "100%": {
            opacity: "0.2",
          },
        },
        scaleUp: {
          "0%": {
            transform: "scale(0)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
        popup: {
          "0%": {
            transform: "scale(0)",
          },
          "50%": {
            transform: "scale(1.3)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
        skeletonWave: {
          "0%": {
            transform: "translateX(-100%)",
          },
          "50%": {
            transform: "translateX(100%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
        spinnerSpin: {
          "0%": {
            transform: "rotate(0deg)",
          },
          "100%": {
            transform: "rotate(360deg)",
          },
        },
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      content: {
        underline: 'url("/public/underline.svg")',
      },
      boxShadow: {
        profilePic:
          "0px 2px 4px -2px rgba(0, 0, 0, 0.10), 0px 4px 6px -1px rgba(0, 0, 0, 0.10)",
      },
      gridTemplateColumns: {
        "18": "repeat(18, minmax(0, 1fr))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
