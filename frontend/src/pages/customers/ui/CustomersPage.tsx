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
  TextField,
  InputAdornment,
  Typography,
  IconButton,
  TablePagination,
  Stack,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useCustomers } from '@/entities/ticket/api/hooks';
import { PageHeader, LoadingState, EmptyState } from '@/shared/ui/EmptyState';
import { GmailStatusBanner } from '@/shared/ui/GmailStatusBanner';
import { HealthScore } from '@/shared/ui/StatusChip';
import type { Customer } from '@/shared/types';
import { formatDistanceToNow } from 'date-fns';
import { tokens } from '@/shared/config/design-tokens';

function CustomerMobileCard({ customer, onOpen }: { customer: Customer; onOpen: (id: string) => void }) {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => onOpen(customer.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(customer.id);
        }
      }}
      sx={{
        p: 2,
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {customer.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {customer.email}
          </Typography>
        </Box>
        <ChevronRightIcon sx={{ color: tokens.colors.textMuted, fontSize: 20 }} />
      </Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1.25 }}>
        <HealthScore score={customer.healthScore} size="small" />
        <Typography variant="caption" color="text.secondary">
          {customer._count?.tickets ?? 0} tickets
        </Typography>
        {customer.company && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1, textAlign: 'right' }}>
            {customer.company}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

export function CustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data, isLoading } = useCustomers({ page: page + 1, limit: rowsPerPage, search: search || undefined });
  const customers = data?.customers ?? [];
  const total = data?.meta?.total ?? 0;

  const openCustomer = (id: string) => navigate(`/customers/${id}`);

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <PageHeader title="Customers" subtitle="View customer profiles and support history" />

      <GmailStatusBanner />

      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          <TextField
            placeholder="Search customers..."
            size="small"
            fullWidth
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: { sm: 400 } }}
          />
        </Box>
      </Card>

      <Card>
        {isLoading ? (
          <LoadingState />
        ) : customers.length === 0 ? (
          <EmptyState title="No customers found" />
        ) : (
          <>
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {customers.map((customer, index) => (
                <Box key={customer.id}>
                  <CustomerMobileCard customer={customer} onOpen={openCustomer} />
                  {index < customers.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>

            <TableContainer sx={{ display: { xs: 'none', md: 'block' }, width: '100%', overflowX: 'auto' }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Health Score</TableCell>
                    <TableCell>Tickets</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => openCustomer(customer.id)}
                    >
                      <TableCell><Typography variant="body2" fontWeight={600}>{customer.name}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{customer.email}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{customer.company ?? '—'}</Typography></TableCell>
                      <TableCell><HealthScore score={customer.healthScore} size="small" /></TableCell>
                      <TableCell><Typography variant="body2">{customer._count?.tickets ?? 0}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(customer.updatedAt), { addSuffix: true })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openCustomer(customer.id); }}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
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
