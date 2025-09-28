/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // <--- This is crucial for your ThemeContext to work
  theme: {
    extend: {
      colors: {
        border: 'oklch(var(--color-border))',
        input: 'oklch(var(--color-input))',
        ring: 'oklch(var(--color-ring))',
        background: 'oklch(var(--color-background))',
        foreground: 'oklch(var(--color-foreground))',
        primary: {
          DEFAULT: 'oklch(var(--color-primary))',
          foreground: 'oklch(var(--color-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'oklch(var(--color-secondary))',
          foreground: 'oklch(var(--color-secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'oklch(var(--color-destructive))',
          foreground: 'oklch(var(--color-destructive-foreground))',
        },
        muted: {
          DEFAULT: 'oklch(var(--color-muted))',
          foreground: 'oklch(var(--color-muted-foreground))',
        },
        accent: {
          DEFAULT: 'oklch(var(--color-accent))',
          foreground: 'oklch(var(--color-accent-foreground))',
        },
        popover: {
          DEFAULT: 'oklch(var(--color-popover))',
          foreground: 'oklch(var(--color-popover-foreground))',
        },
        card: {
          DEFAULT: 'oklch(var(--color-card))',
          foreground: 'oklch(var(--color-card-foreground))',
        },
        // You used a custom 'brand-blue', let's map it to your primary color
        'brand-blue': 'oklch(var(--color-primary))',
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};