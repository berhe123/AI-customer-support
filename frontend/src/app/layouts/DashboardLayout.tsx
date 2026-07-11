import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Sidebar, COLLAPSED_WIDTH, DRAWER_WIDTH } from '@/widgets/sidebar/ui/Sidebar';
import { TopBar } from '@/widgets/topbar/ui/TopBar';
import { useSidebarStore } from '@/shared/lib/stores';
import { useIsMobile } from '@/shared/hooks/useBreakpoint';

export function DashboardLayout() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const isMobile = useIsMobile();
  const sidebarOffset = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: isMobile ? 0 : `${sidebarOffset}px`,
          transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
        }}
      >
        <TopBar />
        <Box
          sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            pb: { xs: 'calc(16px + env(safe-area-inset-bottom, 0px))', sm: 2.5, md: 3 },
            flex: 1,
            width: '100%',
            minWidth: 0,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
