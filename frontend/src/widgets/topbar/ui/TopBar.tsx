import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Badge,
  Tooltip,
  alpha,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore, useSidebarStore } from '@/shared/lib/stores';
import { useIsMobile, useIsSmallMobile } from '@/shared/hooks/useBreakpoint';
import { tokens } from '@/shared/config/design-tokens';

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/tickets': 'Tickets',
  '/customers': 'Customers',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/tickets/')) return 'Ticket';
  if (pathname.startsWith('/customers/')) return 'Customer';
  const match = Object.entries(pageTitles).find(([path]) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path),
  );
  return match?.[1] ?? 'SupportAI';
}

export function TopBar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuthStore();
  const notifications = useNotificationStore((s) => s.notifications);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isSmallMobile = useIsSmallMobile();
  const pageTitle = getPageTitle(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: alpha('#FFFFFF', 0.85),
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${tokens.colors.border}`,
        color: 'text.primary',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          gap: { xs: 1, sm: 1.5 },
          minHeight: { xs: '56px !important', sm: '64px !important', md: '68px !important' },
          px: { xs: 1.5, sm: 2, md: 3 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, minWidth: 0 }}>
          {isMobile && (
            <IconButton
              edge="start"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              sx={{
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: '10px',
                color: tokens.colors.textSecondary,
              }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          )}
          {isMobile && (
            <Typography
              variant="subtitle1"
              fontWeight={700}
              noWrap
              sx={{ color: tokens.colors.textPrimary, fontSize: { xs: '0.9375rem', sm: '1rem' } }}
            >
              {pageTitle}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.5 }, flexShrink: 0 }}>
          {!isSmallMobile && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.5,
                borderRadius: '20px',
                bgcolor: alpha('#34D399', 0.12),
                border: `1px solid ${alpha('#34D399', 0.25)}`,
              }}
            >
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: '#34D399',
                  boxShadow: '0 0 8px #34D399',
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: 0.6, transform: 'scale(0.9)' },
                  },
                }}
              />
              <Typography variant="caption" fontWeight={700} sx={{ color: '#34D399', fontSize: '0.75rem' }}>
                Live
              </Typography>
            </Box>
          )}

          <Tooltip title="Notifications">
            <IconButton
              size="small"
              sx={{
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: '10px',
                color: tokens.colors.textSecondary,
              }}
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsOutlinedIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0, sm: 1.25 },
              cursor: 'pointer',
              pl: { xs: 0.5, sm: 1.5 },
              py: 0.75,
              pr: { xs: 0.5, sm: 1 },
              borderRadius: '12px',
              border: `1px solid ${tokens.colors.border}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(tokens.colors.accent, 0.06),
                borderColor: tokens.colors.borderHover,
              },
            }}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <Avatar
              sx={{
                width: { xs: 32, sm: 34 },
                height: { xs: 32, sm: 34 },
                background: tokens.gradients.button,
                fontSize: '0.8125rem',
                fontWeight: 700,
              }}
            >
              {user?.name?.charAt(0) ?? 'U'}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" fontWeight={600} lineHeight={1.2} fontSize="0.8125rem">
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.colors.textMuted, fontSize: '0.7rem' }}>
                {user?.role === 'ADMIN' ? 'Administrator' : 'Support Agent'}
              </Typography>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleLogout} sx={{ gap: 1, fontSize: '0.875rem' }}>
              <LogoutIcon fontSize="small" />
              Sign out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
