import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

/**
 * AgriSaarthi design tokens.
 * Palette follows the ./reference Dribbble shots: sage page, olive actions,
 * near-black "soil" sections, misty light stages and a small lime accent.
 */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '2rem', lg: '3rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        sage: {
          DEFAULT: '#7C8C74',
          50: '#F3F5F1',
          100: '#E6EAE2',
          200: '#CBD3C5',
          300: '#A9B5A2',
          400: '#8E9C86',
          500: '#7C8C74',
          600: '#65735E',
          700: '#4F5A4A',
          800: '#3A4237',
          900: '#262B24',
        },
        olive: {
          DEFAULT: '#5E7A2E',
          light: '#7A9A40',
          dark: '#3F5620',
          deep: '#1F4D1F',
        },
        lime: {
          DEFAULT: '#C6E36B',
          soft: '#E4F2B5',
        },
        ink: {
          DEFAULT: '#0B0D0A',
          900: '#0B0D0A',
          800: '#131611',
          700: '#1C201A',
          600: '#2A2F27',
        },
        mist: {
          DEFAULT: '#E9EDE6',
          light: '#F4F6F2',
          dark: '#D7DED2',
        },
        soil: {
          DEFAULT: '#5A3E2B',
          light: '#7B5A40',
          dark: '#3B271A',
        },
        /** landing "dry zone" chip – #A63E16 keeps 5:1+ with white and on alert-soft */
        alert: {
          DEFAULT: '#A63E16',
          soft: '#FBE3D6',
        },
        /* ---------- Dashboard ---------- */
        /** single dashboard accent */
        brand: {
          DEFAULT: '#2F6B3F',
          dark: '#245331',
          soft: '#E9F2EB',
          muted: '#CFE3D4',
        },
        /** app background + card lines */
        surface: {
          DEFAULT: '#F5F6F4',
          card: '#FFFFFF',
          line: '#E7E9E5',
          muted: '#F0F2EE',
          /** 3.2:1 on white – input borders, unchecked switch track (WCAG 1.4.11) */
          control: '#8C9289',
        },
        /**
         * status colors: ok / warning / critical
         * DEFAULT values are AA (>= 4.5:1) as text on white AND on their -soft tint,
         * and white text on DEFAULT is AA too (buttons, filled badges).
         */
        ok: { DEFAULT: '#13703A', soft: '#E6F5EC' },
        warn: { DEFAULT: '#8F5400', soft: '#FFF4E0' },
        crit: { DEFAULT: '#B42318', soft: '#FEECEB' },
        // shadcn/ui semantic tokens (mapped to CSS variables in index.css)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
      },
      fontFamily: {
        sans: [
          '"Manrope Variable"',
          'Manrope',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        display: [
          '"Manrope Variable"',
          'Manrope',
          'ui-sans-serif',
          'sans-serif',
        ],
      },
      /**
       * Type scale (use these – no arbitrary text-[Npx]):
       * 3xs 9 · 2xs 10 · caption 11 · xs 12 · body-sm 13 · sm 14 · body 15 · base 16 · lg 18 · xl 20 · 2xl 24 · 3xl 30
       * + display-* for marketing headlines
       */
      fontSize: {
        '3xs': ['0.5625rem', { lineHeight: '0.75rem' }],
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        caption: ['0.6875rem', { lineHeight: '1rem' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        body: ['0.9375rem', { lineHeight: '1.5rem' }],
        eyebrow: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.14em' }],
        'display-sm': ['2.25rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-md': ['3.25rem', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        'display-lg': ['4.5rem', { lineHeight: '0.98', letterSpacing: '-0.04em' }],
        'display-xl': ['5.75rem', { lineHeight: '0.95', letterSpacing: '-0.045em' }],
      },
      /**
       * Radius scale (Tailwind defaults kept in order: sm 2 · DEFAULT 4 · md 6 · lg 8 · xl 12 · 2xl 16 · 3xl 24)
       * card = 2xl (16) on landing and dashboard · stage = 24 · chip = 4 (clipped buttons, tags)
       */
      borderRadius: {
        stage: '24px',
        card: '16px',
        chip: '4px',
      },
      spacing: {
        gutter: '0.75rem',
      },
      boxShadow: {
        glass: '0 10px 40px -12px rgba(20, 30, 15, 0.25)',
        stage: '0 30px 80px -40px rgba(10, 15, 8, 0.45)',
      },
      backdropBlur: {
        glass: '18px',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'dash-flow': {
          to: { strokeDashoffset: '-6' },
        },
        'hero-in': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'none' },
        },
        scan: {
          '0%, 100%': { top: '0%' },
          '50%': { top: 'calc(100% - 2px)' },
        },
        'grow-x': {
          '0%': { width: '4%' },
          '100%': { width: '94%' },
        },
        'soft-pulse': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(2.6)', opacity: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'accordion-up': 'accordion-up 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'soft-pulse': 'soft-pulse 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        /** fake 2 s on-device inference progress */
        /** packets flowing along active mesh links */
        'dash-flow': 'dash-flow 1s linear infinite',
        /** hero entrance – CSS only, runs on prerendered HTML before JS */
        'hero-in': 'hero-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
        'grow-x': 'grow-x 2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
    },
  },
  plugins: [animate],
} satisfies Config
