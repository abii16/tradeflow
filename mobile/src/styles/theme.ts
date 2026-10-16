// TradeFlow Mobile — Production Theme Tokens (Dark & Light Theme Support)
import { Platform } from 'react-native';

export const DARK_THEME = {
  isDark: true,
  colors: {
    background: '#121212',
    surface: '#1A1A1A',
    surfaceElevated: '#222222',
    card: '#1C1C1C',
    cardBorder: '#282828',
    cardBorderHover: '#383838',

    // Primary Brand Emerald (Commerce, revenue, bidding, transporter)
    primary: '#3ECF8E',
    primaryDark: '#2DA870',
    primaryText: '#121212',
    primarySubtle: 'rgba(62, 207, 142, 0.1)',
    primaryBorder: 'rgba(62, 207, 142, 0.25)',

    // Functional Accents
    blue: '#3B82F6',
    blueSubtle: 'rgba(59, 130, 246, 0.12)',
    blueBorder: 'rgba(59, 130, 246, 0.25)',
    amber: '#F59E0B',
    amberSubtle: 'rgba(245, 158, 11, 0.12)',
    red: '#EF4444',
    redSubtle: 'rgba(239, 68, 68, 0.12)',
    redBorder: 'rgba(239, 68, 68, 0.35)',

    // Text Hierarchy
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textMuted: '#6B6B6B',
    textDim: '#444444',

    // Status Colors
    status: {
      open: {
        bg: 'rgba(62, 207, 142, 0.1)',
        text: '#3ECF8E',
        label: 'Open',
      },
      bid_placed: {
        bg: 'rgba(245, 158, 11, 0.1)',
        text: '#F59E0B',
        label: 'Bid Placed',
      },
      in_transit: {
        bg: 'rgba(59, 130, 246, 0.1)',
        text: '#60A5FA',
        label: 'In Transit',
      },
      delivered: {
        bg: 'rgba(150, 150, 150, 0.1)',
        text: '#9E9E9E',
        label: 'Delivered',
      },
    },
  },
  typography: {
    mono: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
};

export const LIGHT_THEME = {
  isDark: false,
  colors: {
    background: '#F6F8FA',
    surface: '#FFFFFF',
    surfaceElevated: '#EDEDF2',
    card: '#FFFFFF',
    cardBorder: '#E2E6EA',
    cardBorderHover: '#CED4DA',

    // Primary Brand Emerald (Crisp high-contrast green for light mode)
    primary: '#10B981',
    primaryDark: '#059669',
    primaryText: '#FFFFFF',
    primarySubtle: 'rgba(16, 185, 129, 0.12)',
    primaryBorder: 'rgba(16, 185, 129, 0.35)',

    // Functional Accents
    blue: '#2563EB',
    blueSubtle: 'rgba(37, 99, 235, 0.12)',
    blueBorder: 'rgba(37, 99, 235, 0.35)',
    amber: '#D97706',
    amberSubtle: 'rgba(217, 119, 6, 0.14)',
    red: '#EF4444',
    redSubtle: 'rgba(239, 68, 68, 0.1)',
    redBorder: 'rgba(239, 68, 68, 0.35)',

    // Text Hierarchy
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    textDim: '#94A3B8',

    // Status Colors
    status: {
      open: {
        bg: 'rgba(16, 185, 129, 0.12)',
        text: '#059669',
        label: 'Open',
      },
      bid_placed: {
        bg: 'rgba(217, 119, 6, 0.12)',
        text: '#D97706',
        label: 'Bid Placed',
      },
      in_transit: {
        bg: 'rgba(37, 99, 235, 0.12)',
        text: '#2563EB',
        label: 'In Transit',
      },
      delivered: {
        bg: 'rgba(100, 116, 139, 0.12)',
        text: '#475569',
        label: 'Delivered',
      },
    },
  },
  typography: {
    mono: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
};

export const THEME = DARK_THEME;
export type ThemeType = typeof DARK_THEME;
