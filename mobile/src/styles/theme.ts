// TradeFlow Mobile — Production Theme Tokens (Clean, Professional Logistics)
import { Platform } from 'react-native';

export const THEME = {
  colors: {
    background: '#121212',
    surface: '#1A1A1A',
    surfaceElevated: '#222222',
    card: '#1C1C1C',
    cardBorder: '#282828',
    cardBorderHover: '#383838',

    // Primary Brand Emerald (used purposefully, not excessively)
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
