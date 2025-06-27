import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Brand kleuren
        brand: {
          50: { value: '#eff6ff' },
          100: { value: '#dbeafe' },
          200: { value: '#bfdbfe' },
          300: { value: '#93c5fd' },
          400: { value: '#60a5fa' },
          500: { value: '#3b82f6' },
          600: { value: '#2563eb' },
          700: { value: '#1d4ed8' },
          800: { value: '#1e40af' },
          900: { value: '#1e3a8a' }
        },
        // Accent kleuren
        purple: {
          50: { value: '#faf5ff' },
          100: { value: '#f3e8ff' },
          200: { value: '#e9d5ff' },
          300: { value: '#d8b4fe' },
          400: { value: '#c084fc' },
          500: { value: '#a855f7' },
          600: { value: '#9333ea' },
          700: { value: '#7c3aed' },
          800: { value: '#6b21b6' },
          900: { value: '#581c87' }
        },
        // Success kleuren
        green: {
          50: { value: '#f0fdf4' },
          100: { value: '#dcfce7' },
          200: { value: '#bbf7d0' },
          300: { value: '#86efac' },
          400: { value: '#4ade80' },
          500: { value: '#22c55e' },
          600: { value: '#16a34a' },
          700: { value: '#15803d' },
          800: { value: '#166534' },
          900: { value: '#14532d' }
        },
        // Warning kleuren
        orange: {
          50: { value: '#fff7ed' },
          100: { value: '#ffedd5' },
          200: { value: '#fed7aa' },
          300: { value: '#fdba74' },
          400: { value: '#fb923c' },
          500: { value: '#f97316' },
          600: { value: '#ea580c' },
          700: { value: '#c2410c' },
          800: { value: '#9a3412' },
          900: { value: '#7c2d12' }
        },
        // Cyan voor publieke tools
        cyan: {
          50: { value: '#ecfeff' },
          100: { value: '#cffafe' },
          200: { value: '#a5f3fc' },
          300: { value: '#67e8f9' },
          400: { value: '#22d3ee' },
          500: { value: '#06b6d4' },
          600: { value: '#0891b2' },
          700: { value: '#0e7490' },
          800: { value: '#155e75' },
          900: { value: '#164e63' }
        },
        // Teal voor organisatie
        teal: {
          50: { value: '#f0fdfa' },
          100: { value: '#ccfbf1' },
          200: { value: '#99f6e4' },
          300: { value: '#5eead4' },
          400: { value: '#2dd4bf' },
          500: { value: '#14b8a6' },
          600: { value: '#0d9488' },
          700: { value: '#0f766e' },
          800: { value: '#115e59' },
          900: { value: '#134e4a' }
        }
      }
    },
    
    semanticTokens: {
      colors: {
        // Achtergrond kleuren
        bg: {
          DEFAULT: { value: 'white' },
          subtle: { value: '{colors.gray.50}' },
          muted: { value: '{colors.gray.100}' },
          panel: { value: 'white' }
        },
        
        // Tekst kleuren
        fg: {
          DEFAULT: { value: '{colors.gray.900}' },
          muted: { value: '{colors.gray.600}' },
          subtle: { value: '{colors.gray.500}' }
        },
        
        // Border kleuren
        border: {
          DEFAULT: { value: '{colors.gray.200}' },
          muted: { value: '{colors.gray.100}' },
          subtle: { value: '{colors.gray.50}' }
        }
      }
    }
  }
});

// Eenvoudige gradient presets
export const gradients = {
  brand: 'linear(135deg, #667eea 0%, #764ba2 100%)',
  blue: 'linear(135deg, #3b82f6 0%, #1d4ed8 100%)',
  green: 'linear(135deg, #10b981 0%, #059669 100%)',
  purple: 'linear(135deg, #8b5cf6 0%, #7c3aed 100%)',
  orange: 'linear(135deg, #f59e0b 0%, #d97706 100%)',
  cyan: 'linear(135deg, #06b6d4 0%, #0891b2 100%)',
  teal: 'linear(135deg, #14b8a6 0%, #0d9488 100%)'
};

export const system = createSystem(defaultConfig, config);
export default system; 