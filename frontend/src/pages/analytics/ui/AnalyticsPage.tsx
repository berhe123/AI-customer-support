import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { useAnalytics } from '@/entities/ticket/api/hooks';
import { PageHeader, LoadingState } from '@/shared/ui/EmptyState';
import { sentimentColors, priorityColors } from '@/shared/config/theme';

const PIE_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#06B6D4'];

export function AnalyticsPage() {
  const { data: analytics, isLoading } = useAnalytics();

  if (isLoading) return <LoadingState message="Loading analytics..." />;

  const sentimentData = (analytics?.sentimentBreakdown ?? []).map((s) => ({
    name: s.sentiment.charAt(0) + s.sentiment.slice(1).toLowerCase(),
    value: s.count,
    color: sentimentColors[s.sentiment],
  }));

  const priorityData = (analytics?.priorityBreakdown ?? []).map((p) => ({
    name: p.priority.charAt(0) + p.priority.slice(1).toLowerCase(),
    count: p.count,
    color: priorityColors[p.priority],
  }));

  const copilot = analytics?.aiCopilot;

  return (
    <Box>
      <PageHeader title="Analytics" subtitle="Performance insights and AI copilot metrics" />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card><CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color="primary.main">{copilot?.acceptanceRate ?? 0}%</Typography>
            <Typography variant="caption" color="text.secondary">AI Acceptance Rate</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card><CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color="warning.main">{copilot?.editRate ?? 0}%</Typography>
            <Typography variant="caption" color="text.secondary">Edit Rate</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card><CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700}>{analytics?.summary.avgResponseTimeMinutes ?? 0}m</Typography>
            <Typography variant="caption" color="text.secondary">Avg Response Time</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card><CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color="error.main">{analytics?.summary.customersAtRisk ?? 0}</Typography>
            <Typography variant="caption" color="text.secondary">At-Risk Customers</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Tickets Per Day</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.ticketsByDay ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#6366F1" strokeWidth={2} name="Total" dot={false} />
                  <Line type="monotone" dataKey="open" stroke="#F59E0B" strokeWidth={2} name="Open" dot={false} />
                  <Line type="monotone" dataKey="closed" stroke="#10B981" strokeWidth={2} name="Closed" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Sentiment Breakdown</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={false}
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.color ?? PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} tickets`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: 1 }}>
                {sentimentData.map((entry) => (
                  <Box
                    key={entry.name}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: entry.color,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                        {entry.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ flexShrink: 0 }}>
                      {entry.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Priority Distribution</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {priorityData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Open vs Closed</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'Open', count: analytics?.summary.openTickets ?? 0, fill: '#6366F1' },
                  { name: 'In Progress', count: analytics?.summary.inProgressTickets ?? 0, fill: '#F59E0B' },
                  { name: 'Closed', count: analytics?.summary.closedTickets ?? 0, fill: '#10B981' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {['#6366F1', '#F59E0B', '#10B981'].map((color) => (
                      <Cell key={color} fill={color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
