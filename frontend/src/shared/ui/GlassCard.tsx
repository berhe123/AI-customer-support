import { Card, CardContent, type CardProps } from '@mui/material';
import { tokens } from '@/shared/config/design-tokens';

interface GlassCardProps extends CardProps {
  glow?: string;
  padding?: number;
  children: React.ReactNode;
}

export function GlassCard({ glow, padding = 2.5, children, sx, ...props }: GlassCardProps) {
  return (
    <Card
      {...props}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        ...(glow && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 120,
            background: tokens.gradients.statGlow(glow),
            pointerEvents: 'none',
          },
        }),
        ...sx,
      }}
    >
      <CardContent sx={{ p: padding, position: 'relative', '&:last-child': { pb: padding } }}>
        {children}
      </CardContent>
    </Card>
  );
}
