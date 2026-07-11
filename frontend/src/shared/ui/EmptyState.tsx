import { Box, CircularProgress, Typography, alpha } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { tokens } from '@/shared/config/design-tokens';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 10,
        px: 4,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '20px',
          bgcolor: alpha('#FFFFFF', 0.04),
          border: `1px solid ${tokens.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2.5,
          color: tokens.colors.textMuted,
        }}
      >
        {icon ?? <InboxOutlinedIcon sx={{ fontSize: 36 }} />}
      </Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: tokens.colors.textSecondary, maxWidth: 400, mb: 2 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
      <CircularProgress size={36} sx={{ color: tokens.colors.accent }} />
      <Typography variant="body2" sx={{ color: tokens.colors.textSecondary, mt: 2 }}>
        {message}
      </Typography>
    </Box>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        gap: { xs: 1.5, sm: 2 },
        mb: { xs: 2.5, md: 3.5 },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h4"
          fontWeight={800}
          letterSpacing="-0.03em"
          align="left"
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.125rem' },
            background: `linear-gradient(135deg, ${tokens.colors.textPrimary} 0%, ${tokens.colors.accent} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{ color: tokens.colors.textSecondary, mt: 0.75, fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
  );
}
