import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  IconButton,
  Tooltip,
  alpha,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSidebarStore } from '@/shared/lib/stores';
import { useIsMobile } from '@/shared/hooks/useBreakpoint';
import { tokens } from '@/shared/config/design-tokens';
import { LogoMark, brandTitleSx } from '@/shared/ui/LogoMark';

const DRAWER_WIDTH = 268;
const COLLAPSED_WIDTH = 76;

const navItems = [
  { label: 'Overview', path: '/', icon: DashboardOutlinedIcon },
  { label: 'Tickets', path: '/tickets', icon: ConfirmationNumberOutlinedIcon },
  { label: 'Customers', path: '/customers', icon: PeopleOutlinedIcon },
  { label: 'Analytics', path: '/analytics', icon: BarChartOutlinedIcon },
  { label: 'Settings', path: '/settings', icon: SettingsOutlinedIcon },
];

function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate: (path: string) => void;
}) {
  const location = useLocation();

  return (
    <>
      {!collapsed && (
        <Typography
          variant="caption"
          sx={{
            px: 2.5,
            pb: 1,
            color: tokens.colors.textMuted,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontSize: '0.65rem',
          }}
        >
          Navigation
        </Typography>
      )}

      <List sx={{ px: 1.5, py: 1, flex: 1 }}>
        {navItems.map(({ label, path, icon: Icon }) => {
          const active =
            path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <ListItemButton
              key={path}
              onClick={() => onNavigate(path)}
              selected={active}
              sx={{
                borderRadius: '10px',
                mb: 0.5,
                minHeight: 46,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1.5 : 2,
                color: active ? tokens.colors.textPrimary : tokens.colors.textSecondary,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  bgcolor: alpha(tokens.colors.accent, 0.1),
                  color: tokens.colors.accent,
                  border: `1px solid ${alpha(tokens.colors.accent, 0.2)}`,
                  '& .MuiListItemIcon-root': { color: tokens.colors.accent },
                  '&:hover': { bgcolor: alpha(tokens.colors.accent, 0.14) },
                },
                '&:hover': {
                  bgcolor: alpha(tokens.colors.accent, 0.05),
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 38,
                  color: active ? tokens.colors.accent : tokens.colors.textMuted,
                }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontWeight: active ? 600 : 500,
                    fontSize: '0.875rem',
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>
    </>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebarStore();
  const showCollapsed = !isMobile && collapsed;
  const width = isMobile ? DRAWER_WIDTH : showCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const drawerContent = (
    <>
      <Box sx={{ p: showCollapsed ? 2 : 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <LogoMark size={showCollapsed ? 'sm' : 'md'} />
        {!showCollapsed && (
          <Box>
            <Typography variant="subtitle1" lineHeight={1.2} sx={brandTitleSx}>
              SupportAI
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.colors.textMuted }}>
              Intelligence Platform
            </Typography>
          </Box>
        )}
      </Box>

      <SidebarNav collapsed={showCollapsed} onNavigate={handleNavigate} />

      {!isMobile && (
        <Box
          sx={{
            p: 1.5,
            borderTop: `1px solid ${tokens.colors.border}`,
            display: 'flex',
            justifyContent: showCollapsed ? 'center' : 'flex-end',
          }}
        >
          <Tooltip title={showCollapsed ? 'Expand' : 'Collapse'}>
            <IconButton
              size="small"
              onClick={toggle}
              sx={{
                color: tokens.colors.textMuted,
                border: `1px solid ${tokens.colors.border}`,
                borderRadius: '8px',
                '&:hover': { bgcolor: alpha(tokens.colors.accent, 0.06) },
              }}
            >
              {showCollapsed ? (
                <ChevronRightIcon fontSize="small" />
              ) : (
                <ChevronLeftIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={() => setMobileOpen(false)}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: isMobile ? 0 : width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          borderRight: `1px solid ${tokens.colors.border}`,
          background: tokens.gradients.sidebar,
          transition: isMobile ? undefined : 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export { DRAWER_WIDTH, COLLAPSED_WIDTH };
