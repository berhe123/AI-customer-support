import { useEffect, useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import SyncIcon from '@mui/icons-material/Sync';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/shared/ui/EmptyState';
import { emailApi } from '@/shared/api';
import { useAuthStore, useNotificationStore } from '@/shared/lib/stores';
import { getErrorMessage } from '@/shared/api/client';
import { ticketKeys } from '@/entities/ticket/api/hooks';
import { tokens } from '@/shared/config/design-tokens';

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['gmail-status'],
    queryFn: async () => (await emailApi.getStatus()).data.data!,
  });

  const { data: setupGuide } = useQuery({
    queryKey: ['gmail-setup'],
    queryFn: async () => (await emailApi.getSetupGuide()).data.data!,
  });

  useEffect(() => {
    const gmailState = searchParams.get('gmail');
    const email = searchParams.get('email');
    const message = searchParams.get('message');

    if (gmailState === 'connected') {
      addNotification('success', `Gmail connected${email ? `: ${email}` : ''}`);
      refetchStatus();
      setSearchParams({}, { replace: true });
    }

    if (gmailState === 'error') {
      addNotification('error', message ? decodeURIComponent(message) : 'Gmail connection failed');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, addNotification, refetchStatus, setSearchParams]);

  const handleConnectGmail = async () => {
    setConnecting(true);
    try {
      const res = await emailApi.getAuthUrl();
      window.location.href = res.data.data!.url;
    } catch (err) {
      addNotification('error', getErrorMessage(err));
      setConnecting(false);
    }
  };

  const handleSyncInbox = async () => {
    setSyncing(true);
    try {
      const res = await emailApi.syncInbox();
      const { created, updated, scanned } = res.data.data!;
      addNotification(
        'success',
        `Inbox synced — ${created} new ticket(s), ${updated} updated, ${scanned} scanned`,
      );
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      refetchStatus();
    } catch (err) {
      addNotification('error', getErrorMessage(err));
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await emailApi.disconnect();
      addNotification('info', 'Gmail disconnected');
      refetchStatus();
    } catch (err) {
      addNotification('error', getErrorMessage(err));
    }
  };

  const handleCleanupPast = async () => {
    const confirmed = window.confirm(
      'Remove all Gmail tickets received before today? Tickets from today onward will stay. Demo/seed tickets are not affected.',
    );
    if (!confirmed) return;

    setCleaning(true);
    try {
      const res = await emailApi.cleanupPast();
      const { deletedTickets, deletedCustomers } = res.data.data!;
      addNotification(
        'success',
        deletedTickets > 0
          ? `Removed ${deletedTickets} past email ticket(s)${deletedCustomers ? ` and ${deletedCustomers} customer(s)` : ''}. Only today's emails will sync.`
          : 'No past Gmail tickets found. If old emails still show, rebuild Docker so the latest fix is running.',
      );
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      refetchStatus();
    } catch (err) {
      addNotification('error', getErrorMessage(err));
    } finally {
      setCleaning(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const canConnect = Boolean(status?.configured);

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle={status?.demoOnly ? 'Account settings — demo data mode' : 'Account settings and Gmail support inbox'}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Profile</Typography>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Name</Typography>
                  <Typography variant="body1" fontWeight={600}>{user?.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{user?.email}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Role</Typography>
                  <Typography variant="body1">{user?.role === 'ADMIN' ? 'Administrator' : 'Support Agent'}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <EmailOutlinedIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>Gmail Support Inbox</Typography>
              </Stack>

              <Alert
                severity={status?.demoOnly ? 'info' : status?.connected ? 'success' : status?.missingSecret ? 'warning' : 'info'}
                sx={{ mb: 2 }}
              >
                {status?.demoOnly
                  ? 'Demo mode is on. The app shows sample tickets only — real Gmail (berhemit2005@gmail.com) is disconnected and will not import messages.'
                  : status?.connected
                    ? `Connected to ${status.emailAddress}. Only emails from today onward are imported (every ${status.syncIntervalSeconds ?? 30}s).`
                    : status?.missingSecret
                      ? `Client ID is set. Add GOOGLE_CLIENT_SECRET to backend/.env, restart Docker, then click Connect Gmail.`
                      : `Connect ${setupGuide?.supportEmail ?? 'berhemit2005@gmail.com'} to receive real customer emails as tickets.`}
              </Alert>

              {!status?.demoOnly && !isAdmin && !status?.connected && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Sign in as <strong>admin@aisupport.com</strong> to connect Gmail. Agents can sync after an admin connects.
                </Alert>
              )}

              {!status?.demoOnly && status?.lastSyncAt && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Last sync: {new Date(status.lastSyncAt).toLocaleString()}
                </Typography>
              )}

              {!status?.demoOnly && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2}>
                {isAdmin && !status?.connected && (
                  <Button
                    variant="contained"
                    onClick={handleConnectGmail}
                    disabled={connecting || !canConnect}
                    startIcon={<EmailOutlinedIcon />}
                  >
                    {connecting ? 'Redirecting...' : 'Connect Gmail'}
                  </Button>
                )}
                {status?.connected && (
                  <>
                    <Button
                      variant="contained"
                      onClick={handleSyncInbox}
                      disabled={syncing}
                      startIcon={<SyncIcon />}
                    >
                      {syncing ? 'Syncing...' : 'Sync Inbox'}
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outlined"
                        color="warning"
                        onClick={handleCleanupPast}
                        disabled={cleaning}
                      >
                        {cleaning ? 'Removing...' : 'Remove past imports'}
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleDisconnect}
                        startIcon={<LinkOffIcon />}
                      >
                        Disconnect
                      </Button>
                    )}
                  </>
                )}
              </Stack>
              )}

              {!status?.demoOnly && !canConnect && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: tokens.colors.messageAgent,
                    border: `1px solid ${tokens.colors.border}`,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Google Gmail API setup (one-time)
                  </Typography>
                  <List dense sx={{ py: 0 }}>
                    {(setupGuide?.steps ?? []).map((step) => (
                      <ListItem key={step} sx={{ px: 0, py: 0.25 }}>
                        <ListItemText
                          primary={step}
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  {setupGuide?.redirectUri && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Redirect URI: {setupGuide.redirectUri}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                    File to edit: <strong>D:\Project\ai-customer-support\backend\.env</strong>
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={1}>About SupportAI</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" paragraph>
                SupportAI is an intelligent customer support platform featuring real-time sentiment analysis,
                AI-powered reply suggestions with confidence scoring, smart ticket routing, customer health scoring,
                and real Gmail inbox integration for incoming and outgoing support email.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Demo admin login:{' '}
                <Button component={RouterLink} to="/login" size="small" sx={{ textTransform: 'none', p: 0, minWidth: 0 }}>
                  admin@aisupport.com
                </Button>
                {' '}/ password123
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
