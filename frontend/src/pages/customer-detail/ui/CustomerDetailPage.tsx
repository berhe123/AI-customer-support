import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Stack,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useCustomer } from '@/entities/ticket/api/hooks';
import { LoadingState } from '@/shared/ui/EmptyState';
import { StatusChip, SentimentChip, HealthScore } from '@/shared/ui/StatusChip';
import { format } from 'date-fns';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useCustomer(id!);

  if (isLoading) return <LoadingState />;
  if (!customer) return null;

  const tickets = (customer as typeof customer & { tickets?: Array<{
    id: string;
    subject: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'URGENT';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: string;
    assignedAgent?: { name: string } | null;
  }> }).tickets ?? [];

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <IconButton onClick={() => navigate('/customers')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" fontWeight={700}>{customer.name}</Typography>
          <Typography variant="body2" color="text.secondary">{customer.email}</Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card><Box sx={{ p: 2.5, textAlign: 'center' }}>
            <HealthScore score={customer.healthScore} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Customer Health</Typography>
          </Box></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><Box sx={{ p: 2.5, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700}>{customer._count?.tickets ?? tickets.length}</Typography>
            <Typography variant="caption" color="text.secondary">Total Tickets</Typography>
          </Box></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><Box sx={{ p: 2.5, textAlign: 'center' }}>
            <Typography variant="body1" fontWeight={600}>{customer.company ?? 'N/A'}</Typography>
            <Typography variant="caption" color="text.secondary">Company</Typography>
          </Box></Card>
        </Grid>
      </Grid>

      <Card>
        <Box sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>Ticket History</Typography>
          {tickets.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No tickets yet</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Sentiment</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/tickets/${ticket.id}`)}>
                      <TableCell><Typography variant="body2" fontWeight={600}>{ticket.subject}</Typography></TableCell>
                      <TableCell><StatusChip status={ticket.status} /></TableCell>
                      <TableCell><SentimentChip sentiment={ticket.sentiment} /></TableCell>
                      <TableCell><Typography variant="body2">{ticket.assignedAgent?.name ?? 'Unassigned'}</Typography></TableCell>
                      <TableCell><Typography variant="caption">{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Card>
    </Box>
  );
}
