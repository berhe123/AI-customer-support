import { Box, Typography } from '@mui/material';

/** Professional brand green — matches logo & UI accent */
export const LOGO_BG = '#166534';
export const LOGO_BG_HOVER = '#15803D';
export const LOGO_TEXT = '#FFFFFF';

type LogoSize = 'sm' | 'md' | 'lg';

const sizes: Record<LogoSize, { box: number; font: string; radius: string }> = {
  sm: { box: 36, font: '1rem', radius: '10px' },
  md: { box: 40, font: '1.125rem', radius: '11px' },
  lg: { box: 48, font: '1.375rem', radius: '13px' },
};

interface LogoMarkProps {
  size?: LogoSize;
}

export function LogoMark({ size = 'md' }: LogoMarkProps) {
  const s = sizes[size];
  return (
    <Box
      sx={{
        width: s.box,
        height: s.box,
        borderRadius: s.radius,
        bgcolor: LOGO_BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(22, 101, 52, 0.35)',
        transition: 'background-color 0.2s ease',
        '&:hover': { bgcolor: LOGO_BG_HOVER },
      }}
    >
      <Typography
        component="span"
        sx={{
          color: LOGO_TEXT,
          fontWeight: 800,
          fontSize: s.font,
          lineHeight: 1,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          letterSpacing: '-0.04em',
          userSelect: 'none',
        }}
      >
        S
      </Typography>
    </Box>
  );
}

/** Brand wordmark style — use next to logo */
export const brandTitleSx = {
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: LOGO_BG,
} as const;
