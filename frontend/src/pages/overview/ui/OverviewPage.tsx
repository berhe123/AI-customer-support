import { Grid, Typography, Box, List, ListItem, ListItemText, Chip, alpha } from '@mui/material';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { useAnalytics, useTickets } from '@/entities/ticket/api/hooks';
import { PageHeader, LoadingState } from '@/shared/ui/EmptyState';
import { GlassCard } from '@/shared/ui/GlassCard';
import { StatusChip, SentimentChip } from '@/shared/ui/StatusChip';
import { tokens } from '@/shared/config/design-tokens';
import { formatDistanceToNow } from 'date-fns';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <GlassCard glow={color} padding={2.5}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" sx={{ color: tokens.colors.textMuted, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5, letterSpacing: '-0.03em' }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: tokens.colors.textSecondary, mt: 0.5, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '14px',
            bgcolor: alpha(color, 0.12),
            border: `1px solid ${alpha(color, 0.25)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </GlassCard>
  );
}

export function OverviewPage() {
  const { data: analytics, isLoading } = useAnalytics();
  const { data: urgentTickets } = useTickets({ sentiment: 'URGENT', limit: 5 });
  const navigate = useNavigate();

  if (isLoading) return <LoadingState message="Loading dashboard..." />;

  const summary = analytics?.summary;

  return (
    <Box>
      <PageHeader
        title="Overview"
        subtitle="Real-time support intelligence at a glance"
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tickets"
            value={summary?.totalTickets ?? 0}
            icon={<ConfirmationNumberOutlinedIcon />}
            color="#166534"
            subtitle={`${summary?.ticketsThisWeek ?? 0} this week`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Open Tickets"
            value={summary?.openTickets ?? 0}
            icon={<HourglassEmptyOutlinedIcon />}
            color="#FBBF24"
            subtitle={`${summary?.inProgressTickets ?? 0} in progress`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Resolved"
            value={summary?.closedTickets ?? 0}
            icon={<CheckCircleOutlineIcon />}
            color="#34D399"
            subtitle={`${summary?.avgResponseTimeMinutes ?? 0}min avg response`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="At-Risk Customers"
            value={summary?.customersAtRisk ?? 0}
            icon={<WarningAmberOutlinedIcon />}
            color="#F87171"
            subtitle="Health score below 50"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <GlassCard padding={2.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h6" fontWeight={700} letterSpacing="-0.02em">
                Recent Tickets
              </Typography>
              <Chip
                icon={<TrendingUpIcon sx={{ fontSize: '16px !important' }} />}
                label="View all"
                size="small"
                clickable
                onClick={() => navigate('/tickets')}
                sx={{
                  bgcolor: alpha(tokens.colors.accent, 0.12),
                  color: tokens.colors.accentLight,
                  border: `1px solid ${alpha(tokens.colors.accent, 0.25)}`,
                  fontWeight: 600,
                  '&:hover': { bgcolor: alpha(tokens.colors.accent, 0.2) },
                }}
              />
            </Box>
            <List disablePadding>
              {(analytics?.recentTickets ?? []).map((ticket, i) => (
                <ListItem
                  key={ticket.id}
                  sx={{
                    px: 1.5,
                    py: 1.5,
                    mb: 0.5,
                    cursor: 'pointer',
                    borderRadius: '10px',
                    border: `1px solid transparent`,
                    transition: 'all 0.2s ease',
                    ...(i < (analytics?.recentTickets?.length ?? 0) - 1 && {
                      borderBottom: `1px solid ${tokens.colors.border}`,
                      borderRadius: 0,
                      mb: 0,
                    }),
                    '&:hover': {
                      bgcolor: alpha(tokens.colors.accent, 0.06),
                      borderColor: tokens.colors.border,
                      borderRadius: '10px',
                    },
                  }}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" fontWeight={600}>
                          {ticket.subject}
                        </Typography>
                        <StatusChip status={ticket.status} />
                        <SentimentChip sentiment={ticket.sentiment} />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: tokens.colors.textMuted, mt: 0.5, display: 'block' }}>
                        {ticket.customer.name} · {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                      </Typography>
                    }
                  />
                  <ArrowForwardIcon sx={{ fontSize: 16, color: tokens.colors.textMuted, opacity: 0.5 }} />
                </ListItem>
              ))}
            </List>
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <GlassCard glow="#F87171" padding={2.5} sx={{ mb: 2.5 }}>
            <Typography variant="h6" fontWeight={700} mb={2} letterSpacing="-0.02em">
              Urgent Tickets
            </Typography>
            {(urgentTickets?.tickets ?? []).length === 0 ? (
              <Typography variant="body2" sx={{ color: tokens.colors.textSecondary }}>
                No urgent tickets — great job!
              </Typography>
            ) : (
              <List disablePadding>
                {(urgentTickets?.tickets ?? []).map((ticket) => (
                  <ListItem
                    key={ticket.id}
                    sx={{
                      px: 1,
                      py: 1,
                      cursor: 'pointer',
                      borderRadius: '8px',
                      '&:hover': { bgcolor: alpha('#F87171', 0.08) },
                    }}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <ListItemText
                      primary={ticket.subject}
                      secondary={ticket.customer.name}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: 'caption', sx: { color: tokens.colors.textMuted } }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </GlassCard>

          <GlassCard glow="#166534" padding={2.5}>
            <Typography variant="h6" fontWeight={700} mb={2.5} letterSpacing="-0.02em">
              AI Copilot
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { label: 'Acceptance Rate', value: `${analytics?.aiCopilot.acceptanceRate ?? 0}%`, color: '#34D399' },
                { label: 'Total Suggestions', value: analytics?.aiCopilot.totalSuggestions ?? 0, color: tokens.colors.textPrimary },
                { label: 'Avg Confidence', value: `${Math.round((analytics?.aiCopilot.avgConfidence ?? 0) * 100)}%`, color: tokens.colors.accentLight },
              ].map(({ label, value, color }) => (
                <Box key={label}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: tokens.colors.textMuted }}>{label}</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color }}>{value}</Typography>
                  </Box>
                  <Box sx={{ height: 4, borderRadius: 2, bgcolor: alpha('#FFFFFF', 0.06), overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: typeof value === 'string' && value.includes('%') ? value : '60%', bgcolor: color, borderRadius: 2, opacity: 0.7 }} />
                  </Box>
                </Box>
              ))}
            </Box>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
}
