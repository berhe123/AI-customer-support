import { Alert, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { emailApi } from '@/shared/api';

export function GmailStatusBanner() {
  const { data: status } = useQuery({
    queryKey: ['gmail-status'],
    queryFn: async () => (await emailApi.getStatus()).data.data!,
  });

  if (!status || status.connected || status.demoOnly) return null;

  const message = status.missingSecret
    ? 'Gmail is almost ready — add your GOOGLE_CLIENT_SECRET to backend/.env, restart Docker, then connect in Settings.'
    : !status.configured
      ? 'Gmail is not configured yet. Complete Google API setup in Settings to receive real customer emails.'
      : 'Gmail is configured but not connected. Go to Settings and click Connect Gmail, then Sync Inbox.';

  return (
    <Box sx={{ mb: 2 }}>
      <Alert
        severity={status.missingSecret ? 'warning' : 'info'}
        action={
          <Button color="inherit" size="small" component={RouterLink} to="/settings">
            Open Settings
          </Button>
        }
      >
        {message}
      </Alert>
    </Box>
  );
}
