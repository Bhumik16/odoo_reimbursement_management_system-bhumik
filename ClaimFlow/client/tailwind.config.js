/** @type {import('tailwindcss').Config} */
import { colors } from './src/theme/colors.js';
import { spacing } from './src/theme/spacing.js';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        'primary-hover': colors.primaryHover,
        'primary-light': colors.primaryLight,
        background: colors.background,
        surface: colors.surface,
        'text-primary': colors.textPrimary,
        'text-secondary': colors.textSecondary,
        border: colors.border,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
      },
      spacing: spacing,
      borderRadius: {
        'xl': '12px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.05)',
      },
      transitionDuration: {
        'DEFAULT': '150ms',
      }
    },
  },
  plugins: [],
}
