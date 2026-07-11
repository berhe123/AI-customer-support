import { Snackbar, Alert } from '@mui/material';
import { useNotificationStore } from '@/shared/lib/stores';

const severityMap = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
} as const;

export function NotificationToasts() {
  const notifications = useNotificationStore((s) => s.notifications);
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const latest = notifications[notifications.length - 1];

  if (!latest) return null;

  return (
    <Snackbar
      key={latest.id}
      open
      autoHideDuration={5000}
      onClose={() => removeNotification(latest.id)}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: 8, zIndex: (theme) => theme.zIndex.snackbar + 1 }}
    >
      <Alert
        severity={severityMap[latest.type]}
        variant="filled"
        onClose={() => removeNotification(latest.id)}
        sx={{ width: '100%', maxWidth: 420, boxShadow: 3 }}
      >
        {latest.message}
      </Alert>
    </Snackbar>
  );
}
