import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  LinearProgress,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useGenerateAiReply, useLogAiReply } from '@/entities/ticket/api/hooks';
import { getErrorMessage } from '@/shared/api/client';
import { useNotificationStore } from '@/shared/lib/stores';
import { tokens } from '@/shared/config/design-tokens';
import { alpha } from '@mui/material';

interface AiCopilotPanelProps {
  ticketId: string;
  onAccept: (content: string) => void;
}

export function AiCopilotPanel({ ticketId, onAccept }: AiCopilotPanelProps) {
  const [suggestion, setSuggestion] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [reasoning, setReasoning] = useState('');
  const [showReasoning, setShowReasoning] = useState(false);
  const [startTime, setStartTime] = useState(0);

  const generateMutation = useGenerateAiReply();
  const logMutation = useLogAiReply();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const handleGenerate = async () => {
    setStartTime(Date.now());
    try {
      const res = await generateMutation.mutateAsync(ticketId);
      const data = res.data.data!;
      setSuggestion(data.suggestion);
      setConfidence(data.confidence);
      setReasoning(data.reasoning);
    } catch (err) {
      addNotification('error', getErrorMessage(err));
    }
  };

  const logAction = async (action: 'ACCEPTED' | 'EDITED' | 'REJECTED', finalReply?: string) => {
    await logMutation.mutateAsync({
      ticketId,
      suggestion: generateMutation.data?.data.data?.suggestion ?? suggestion,
      finalReply,
      action,
      confidence,
      responseTime: Date.now() - startTime,
    });
  };

  const handleAccept = async () => {
    await logAction('ACCEPTED', suggestion);
    onAccept(suggestion);
    reset();
    addNotification('success', 'AI reply accepted and sent');
  };

  const handleEditSend = async () => {
    const original = generateMutation.data?.data.data?.suggestion ?? '';
    const action = suggestion !== original ? 'EDITED' : 'ACCEPTED';
    await logAction(action, suggestion);
    onAccept(suggestion);
    reset();
    addNotification('success', 'Reply sent');
  };

  const handleReject = async () => {
    await logAction('REJECTED');
    reset();
    addNotification('info', 'AI suggestion rejected');
  };

  const reset = () => {
    setSuggestion('');
    setConfidence(0);
    setReasoning('');
    generateMutation.reset();
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '16px',
        bgcolor: tokens.colors.bgElevated,
        border: `1px solid ${tokens.colors.border}`,
        boxShadow: tokens.shadows.card,
        transition: 'all 0.3s ease',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: tokens.gradients.button,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AutoAwesomeIcon sx={{ color: 'white', fontSize: 18 }} />
        </Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: tokens.colors.accentLight }}>
          AI Copilot
        </Typography>
        {confidence > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            Confidence: {Math.round(confidence * 100)}%
          </Typography>
        )}
      </Stack>

      {!suggestion && !generateMutation.isPending && (
        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          onClick={handleGenerate}
          fullWidth
          sx={{ py: 1.3 }}
        >
          Generate AI Reply
        </Button>
      )}

      {generateMutation.isPending && (
        <Box>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Analyzing ticket context and generating response...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {suggestion && (
        <Box>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            variant="outlined"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                bgcolor: tokens.colors.messageAgent,
                borderRadius: '12px',
                '& fieldset': { borderColor: tokens.colors.messageBorder },
                '&:hover fieldset': { borderColor: tokens.colors.borderHover },
                '&.Mui-focused fieldset': { borderColor: alpha(tokens.colors.textMuted, 0.4) },
              },
            }}
          />

          {confidence > 0 && (
            <LinearProgress
              variant="determinate"
              value={confidence * 100}
              sx={{ mb: 2, height: 4, borderRadius: 2 }}
            />
          )}

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              onClick={handleAccept}
              size="small"
              sx={{ flex: { xs: '1 1 45%', sm: '0 0 auto' } }}
            >
              Accept
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEditSend}
              size="small"
              sx={{ flex: { xs: '1 1 45%', sm: '0 0 auto' } }}
            >
              Send Edited
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CloseIcon />}
              onClick={handleReject}
              size="small"
              sx={{ flex: { xs: '1 1 45%', sm: '0 0 auto' } }}
            >
              Reject
            </Button>
            <Tooltip title="View AI reasoning">
              <IconButton size="small" onClick={() => setShowReasoning(!showReasoning)}>
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          <Collapse in={showReasoning}>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {reasoning}
            </Typography>
          </Collapse>
        </Box>
      )}
    </Paper>
  );
}
