// TradeFlow Mobile — Design System Tokens (Aligned with Web UI)
import { Platform } from 'react-native';

export const THEME = {
  colors: {
    // Backgrounds
    background: '#121212',
    backgroundSurface: '#181818',
    card: '#202020',
    cardElevated: '#262626',
    cardHighlight: '#2A2A2A',

    // Borders
    border: '#2E2E2E',
    borderMuted: '#242424',
    borderLight: '#3A3A3A',
    borderFocus: '#3ECF8E',

    // Primary Emerald (TradeFlow Signature)
    emerald: '#3ECF8E',
    emeraldGlow: 'rgba(62, 207, 142, 0.12)',
    emeraldGlowStrong: 'rgba(62, 207, 142, 0.25)',
    emeraldDark: '#2DA870',
    emeraldText: '#121212',

    // Accents
    blue: '#38BDF8',
    blueGlow: 'rgba(56, 189, 248, 0.12)',
    amber: '#F59E0B',
    amberGlow: 'rgba(245, 158, 11, 0.12)',
    red: '#EF4444',
    redGlow: 'rgba(239, 68, 68, 0.12)',
    purple: '#A855F7',

    // Typography
    textPrimary: '#EDEDED',
    textSecondary: '#A0A0A0',
    textMuted: '#707070',
    textDim: '#4A4A4A',

    // Status Badges
    status: {
      open: {
        bg: 'rgba(62, 207, 142, 0.12)',
        border: 'rgba(62, 207, 142, 0.35)',
        text: '#3ECF8E',
        label: 'OPEN FOR BIDDING',
      },
      bid_placed: {
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.35)',
        text: '#F59E0B',
        label: 'BID PLACED',
      },
      in_transit: {
        bg: 'rgba(56, 189, 248, 0.12)',
        border: 'rgba(56, 189, 248, 0.35)',
        text: '#38BDF8',
        label: 'IN TRANSIT',
      },
      delivered: {
        bg: 'rgba(160, 160, 160, 0.12)',
        border: 'rgba(160, 160, 160, 0.35)',
        text: '#A0A0A0',
        label: 'DELIVERED',
      },
    },
  },
  typography: {
    fontMono: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
};
