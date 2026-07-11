import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  Button,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTickets } from '@/entities/ticket/api/hooks';
import { PageHeader, LoadingState, EmptyState } from '@/shared/ui/EmptyState';
import { GmailStatusBanner } from '@/shared/ui/GmailStatusBanner';
import { StatusChip, PriorityChip, SentimentChip } from '@/shared/ui/StatusChip';
import type { TicketStatus, TicketPriority, Sentiment, Ticket } from '@/shared/types';
import { formatDistanceToNow } from 'date-fns';
import { tokens } from '@/shared/config/design-tokens';

function TicketMobileCard({ ticket, onOpen }: { ticket: Ticket; onOpen: (id: string) => void }) {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => onOpen(ticket.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(ticket.id);
        }
      }}
      sx={{
        p: 2,
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        '&:hover': { bgcolor: 'action.hover' },
        '&:active': { bgcolor: 'action.selected' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="body2" fontWeight={700} sx={{ flex: 1, lineHeight: 1.4 }}>
          {ticket.subject}
        </Typography>
        <ChevronRightIcon sx={{ color: tokens.colors.textMuted, fontSize: 20, mt: 0.25 }} />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {ticket.customer.name} · {ticket.customer.email}
      </Typography>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.25, gap: 0.75 }}>
        <StatusChip status={ticket.status} />
        <PriorityChip priority={ticket.priority} />
        <SentimentChip sentiment={ticket.sentiment} />
      </Stack>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.25 }}>
        <Typography variant="caption" color="text.secondary">
          {ticket.assignedAgent?.name ?? 'Unassigned'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
        </Typography>
      </Box>
    </Box>
  );
}

export function TicketsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [priority, setPriority] = useState<TicketPriority | ''>('');
  const [sentiment, setSentiment] = useState<Sentiment | ''>('');

  const { data, isLoading } = useTickets({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
    status: status || undefined,
    priority: priority || undefined,
    sentiment: sentiment || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const tickets = data?.tickets ?? [];
  const total = data?.meta?.total ?? 0;

  const openTicket = (id: string) => {
    navigate(`/tickets/${id}`);
  };

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <PageHeader
        title="Tickets"
        subtitle="Manage and respond to customer support tickets"
      />

      <GmailStatusBanner />

      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
            <TextField
              placeholder="Search tickets..."
              size="small"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: { xs: '100%', sm: 240 }, flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value as TicketStatus | ''); setPage(0); }}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="CLOSED">Closed</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
              <InputLabel>Priority</InputLabel>
              <Select value={priority} label="Priority" onChange={(e) => { setPriority(e.target.value as TicketPriority | ''); setPage(0); }}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
              <InputLabel>Sentiment</InputLabel>
              <Select value={sentiment} label="Sentiment" onChange={(e) => { setSentiment(e.target.value as Sentiment | ''); setPage(0); }}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="POSITIVE">Positive</MenuItem>
                <MenuItem value="NEUTRAL">Neutral</MenuItem>
                <MenuItem value="NEGATIVE">Negative</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </Card>

      <Card>
        {isLoading ? (
          <LoadingState />
        ) : tickets.length === 0 ? (
          <EmptyState title="No tickets found" description="Try adjusting your filters or wait for new incoming tickets." />
        ) : (
          <>
            {/* Mobile card list */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {tickets.map((ticket, index) => (
                <Box key={ticket.id}>
                  <TicketMobileCard ticket={ticket} onOpen={openTicket} />
                  {index < tickets.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>

            {/* Desktop table */}
            <TableContainer sx={{ display: { xs: 'none', md: 'block' }, width: '100%', overflowX: 'auto' }}>
              <Table sx={{ minWidth: 960 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Sentiment</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Open</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      hover
                      tabIndex={0}
                      role="link"
                      aria-label={`Open ticket ${ticket.subject}`}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => openTicket(ticket.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openTicket(ticket.id);
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {ticket.subject}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{ticket.customer.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{ticket.customer.email}</Typography>
                      </TableCell>
                      <TableCell><StatusChip status={ticket.status} /></TableCell>
                      <TableCell><PriorityChip priority={ticket.priority} /></TableCell>
                      <TableCell><SentimentChip sentiment={ticket.sentiment} /></TableCell>
                      <TableCell>
                        <Typography variant="body2">{ticket.assignedAgent?.name ?? 'Unassigned'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTicket(ticket.id);
                          }}
                          sx={{ textTransform: 'none', minWidth: 80 }}
                        >
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{
                '.MuiTablePagination-toolbar': { flexWrap: 'wrap', gap: 1 },
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  display: { xs: 'none', sm: 'block' },
                },
              }}
            />
          </>
        )}
      </Card>
    </Box>
  );
}
