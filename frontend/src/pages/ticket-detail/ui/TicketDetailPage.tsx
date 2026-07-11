import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Avatar,
  Divider,
  Chip,
  Grid,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import { alpha } from '@mui/material';
import { useTicket, useUpdateTicket, useAddMessage, useAgents } from '@/entities/ticket/api/hooks';
import { AiCopilotPanel } from '@/features/ai-reply/ui/AiCopilotPanel';
import { LoadingState } from '@/shared/ui/EmptyState';
import { StatusChip, PriorityChip, SentimentChip, HealthScore } from '@/shared/ui/StatusChip';
import { MessageAttachments } from '@/shared/ui/MessageAttachments';
import { useNotificationStore } from '@/shared/lib/stores';
import { getErrorMessage } from '@/shared/api/client';
import { tokens } from '@/shared/config/design-tokens';
import type { TicketStatus, TicketPriority } from '@/shared/types';
import type { Message } from '@/shared/types';

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp';

function getMessageBubbleStyles(msg: Message) {
  if (msg.isAgent) {
    return {
      bgcolor: tokens.colors.messageAgent,
      border: `1px solid ${tokens.colors.messageBorder}`,
      color: tokens.colors.textPrimary,
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      ...(msg.isAiGenerated && {
        borderLeft: `3px solid ${alpha(tokens.colors.textMuted, 0.5)}`,
      }),
    };
  }

  return {
    bgcolor: tokens.colors.messageCustomer,
    border: `1px solid ${tokens.colors.messageBorder}`,
    color: tokens.colors.textPrimary,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  };
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reply, setReply] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: ticket, isLoading } = useTicket(id!);
  const { data: agents } = useAgents();
  const updateMutation = useUpdateTicket();
  const addMessageMutation = useAddMessage();
  const addNotification = useNotificationStore((s) => s.addNotification);

  if (isLoading) return <LoadingState message="Loading ticket..." />;
  if (!ticket) return null;

  const handleStatusChange = async (status: TicketStatus) => {
    try {
      await updateMutation.mutateAsync({ id: ticket.id, data: { status } });
      addNotification('success', `Ticket marked as ${status.replace('_', ' ').toLowerCase()}`);
    } catch (err) {
      addNotification('error', getErrorMessage(err));
    }
  };

  const handlePriorityChange = async (priority: TicketPriority) => {
    try {
      await updateMutation.mutateAsync({ id: ticket.id, data: { priority } });
    } catch (err) {
      addNotification('error', getErrorMessage(err));
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    try {
      await updateMutation.mutateAsync({ id: ticket.id, data: { assignedAgentId: agentId || null } });
    } catch (err) {
      addNotification('error', getErrorMessage(err));
    }
  };

  const handleSendReply = async (content: string, isAiGenerated = false, files: File[] = pendingFiles) => {
    if (!content.trim() && files.length === 0) return;

    try {
      await addMessageMutation.mutateAsync({ ticketId: ticket.id, content, isAiGenerated, files });
      setReply('');
      setPendingFiles([]);
      addNotification('success', files.length ? 'Reply with attachments sent' : 'Reply sent');
    } catch (err) {
      addNotification('error', getErrorMessage(err));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length) return;

    setPendingFiles((prev) => {
      const combined = [...prev, ...selected];
      return combined.slice(0, 5);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = reply.trim().length > 0 || pendingFiles.length > 0;

  const handleAiAccept = (content: string) => {
    handleSendReply(content, true, pendingFiles);
  };

  return (
    <Box>
      <Stack direction="row" alignItems="flex-start" spacing={1} mb={{ xs: 2, md: 3 }}>
        <IconButton onClick={() => navigate('/tickets')} size="small" sx={{ mt: 0.25 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ fontSize: { xs: '1.125rem', sm: '1.375rem', md: '1.5rem' }, wordBreak: 'break-word' }}
          >
            {ticket.subject}
          </Typography>
          <Stack direction="row" spacing={1} mt={0.75} flexWrap="wrap" useFlexGap sx={{ gap: 0.75 }}>
            <StatusChip status={ticket.status} />
            <PriorityChip priority={ticket.priority} />
            <SentimentChip sentiment={ticket.sentiment} />
            {ticket.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
          </Stack>
        </Box>
      </Stack>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 2 }}>
            <Box sx={{ p: { xs: 2, sm: 2.5 }, maxHeight: { xs: 360, sm: 420, md: 500 }, overflow: 'auto' }}>
              {(ticket.messages ?? []).map((msg) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    flexDirection: msg.isAgent ? 'row-reverse' : 'row',
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: msg.isAgent ? '#64748B' : '#94A3B8',
                      fontSize: '0.75rem',
                    }}
                  >
                    {msg.isAgent ? (msg.author?.name?.charAt(0) ?? 'A') : ticket.customer.name.charAt(0)}
                  </Avatar>
                  <Box
                    sx={{
                      maxWidth: { xs: '88%', sm: '75%' },
                      p: 1.5,
                      borderRadius: '12px',
                      ...getMessageBubbleStyles(msg),
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {msg.content}
                    </Typography>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <MessageAttachments attachments={msg.attachments} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{ color: tokens.colors.textMuted, mt: 0.75, display: 'block' }}
                    >
                      {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                      {msg.isAiGenerated && ' · AI assisted'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <Divider />
            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
              {pendingFiles.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={0.75} mb={1.5}>
                  {pendingFiles.map((file, index) => (
                    <Chip
                      key={`${file.name}-${index}`}
                      label={file.name}
                      size="small"
                      onDelete={() => removePendingFile(index)}
                      deleteIcon={<CloseIcon />}
                      variant="outlined"
                    />
                  ))}
                </Stack>
              )}
              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={6}
                placeholder="Type your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                sx={{
                  mb: 1.5,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: tokens.colors.messageAgent,
                    borderRadius: '12px',
                    '& fieldset': { borderColor: tokens.colors.messageBorder },
                    '&:hover fieldset': { borderColor: tokens.colors.borderHover },
                    '&.Mui-focused fieldset': { borderColor: alpha(tokens.colors.textMuted, 0.4) },
                  },
                }}
              />
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  multiple
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleFileSelect}
                />
                <Button
                  variant="contained"
                  endIcon={<SendIcon />}
                  disabled={!canSend || addMessageMutation.isPending}
                  onClick={() => handleSendReply(reply)}
                  sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
                >
                  Send Reply
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AttachFileIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={pendingFiles.length >= 5}
                >
                  Attach
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                PDF, Word, Excel, PowerPoint, text, and images up to 10 MB each (max 5 files)
              </Typography>
            </Box>
          </Card>

          <AiCopilotPanel ticketId={ticket.id} onAccept={handleAiAccept} />
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <Box sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={2}>Ticket Details</Typography>

              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={ticket.status} label="Status" onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}>
                    <MenuItem value="OPEN">Open</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="CLOSED">Closed</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select value={ticket.priority} label="Priority" onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}>
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Assigned Agent</InputLabel>
                  <Select
                    value={ticket.assignedAgentId ?? ''}
                    label="Assigned Agent"
                    onChange={(e) => handleAssignAgent(e.target.value)}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {(agents ?? []).map((agent) => (
                      <MenuItem key={agent.id} value={agent.id}>
                        {agent.name} ({agent.openTicketCount} open)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>
          </Card>

          <Card>
            <Box sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={2}>Customer</Typography>
              <Typography variant="body2" fontWeight={600}>{ticket.customer.name}</Typography>
              <Typography variant="caption" color="text.secondary">{ticket.customer.email}</Typography>
              <Box sx={{ mt: 1 }}>
                <HealthScore score={ticket.customer.healthScore} />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Created {format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
