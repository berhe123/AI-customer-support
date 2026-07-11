import { createTheme, alpha } from '@mui/material/styles';
import { tokens } from './design-tokens';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: tokens.colors.accent,
      light: tokens.colors.accentMuted,
      dark: '#14532D',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: tokens.colors.accentCyan,
      light: '#34D399',
      dark: '#047857',
    },
    success: { main: '#10B981', light: '#34D399', dark: '#059669' },
    warning: { main: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
    error: { main: '#EF4444', light: '#F87171', dark: '#DC2626' },
    background: {
      default: tokens.colors.bgBase,
      paper: tokens.colors.bgElevated,
    },
    text: {
      primary: tokens.colors.textPrimary,
      secondary: tokens.colors.textSecondary,
      disabled: tokens.colors.textMuted,
    },
    divider: tokens.colors.border,
    action: {
      hover: alpha(tokens.colors.accent, 0.06),
      selected: alpha(tokens.colors.accent, 0.1),
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontWeight: 700, fontSize: '2.25rem', letterSpacing: '-0.03em', lineHeight: 1.2 },
    h2: { fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.025em' },
    h3: { fontWeight: 600, fontSize: '1.375rem', letterSpacing: '-0.02em' },
    h4: { fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, fontSize: '1.0625rem', letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, fontSize: '0.9375rem' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.55 },
    caption: { fontSize: '0.8125rem', letterSpacing: '0.01em' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
  },
  shape: { borderRadius: tokens.radius.md },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.colors.bgBase,
          backgroundImage: tokens.gradients.mesh,
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
        '*::-webkit-scrollbar': { width: 8, height: 8 },
        '*::-webkit-scrollbar-track': { background: alpha('#0F172A', 0.04) },
        '*::-webkit-scrollbar-thumb': {
          background: alpha('#0F172A', 0.15),
          borderRadius: 4,
          '&:hover': { background: alpha('#0F172A', 0.25) },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.md,
          padding: '10px 22px',
          fontSize: '0.875rem',
          transition: 'all 0.2s ease',
        },
        contained: {
          background: tokens.gradients.button,
          boxShadow: '0 4px 14px rgba(22, 101, 52, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(22, 101, 52, 0.4)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: tokens.colors.border,
          color: tokens.colors.textPrimary,
          '&:hover': {
            borderColor: tokens.colors.borderHover,
            bgcolor: alpha(tokens.colors.accent, 0.04),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.lg,
          background: tokens.colors.bgSurface,
          border: `1px solid ${tokens.colors.border}`,
          boxShadow: tokens.shadows.card,
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            boxShadow: tokens.shadows.cardHover,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: tokens.radius.md,
            bgcolor: '#FFFFFF',
            transition: 'all 0.2s ease',
            '& fieldset': { borderColor: tokens.colors.border },
            '&:hover fieldset': { borderColor: tokens.colors.borderHover },
            '&.Mui-focused fieldset': {
              borderColor: tokens.colors.accent,
              boxShadow: `0 0 0 3px ${alpha(tokens.colors.accent, 0.15)}`,
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: tokens.colors.border },
        head: {
          fontWeight: 600,
          color: tokens.colors.textMuted,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          bgcolor: alpha(tokens.colors.bgBase, 0.8),
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { bgcolor: alpha(tokens.colors.accent, 0.04) },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem' },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          bgcolor: tokens.colors.bgElevated,
          border: `1px solid ${tokens.colors.border}`,
          boxShadow: tokens.shadows.dropdown,
          borderRadius: tokens.radius.md,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundImage: 'none' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: tokens.radius.md },
      },
    },
  },
});

export const sentimentColors: Record<string, string> = {
  POSITIVE: '#10B981',
  NEUTRAL: '#64748B',
  NEGATIVE: '#F59E0B',
  URGENT: '#EF4444',
};

export const priorityColors: Record<string, string> = {
  LOW: '#64748B',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
};

export const statusColors: Record<string, string> = {
  OPEN: '#166534',
  IN_PROGRESS: '#F59E0B',
  CLOSED: '#10B981',
};
