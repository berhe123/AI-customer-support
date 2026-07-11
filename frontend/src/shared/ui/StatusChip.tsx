import { Chip, type ChipProps } from '@mui/material';
import { sentimentColors, priorityColors, statusColors } from '../config/theme';
import type { Sentiment, TicketPriority, TicketStatus } from '../types';

interface StatusChipProps extends Omit<ChipProps, 'label' | 'color'> {
  status: TicketStatus;
}

export function StatusChip({ status, ...props }: StatusChipProps) {
  const labels: Record<TicketStatus, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    CLOSED: 'Closed',
  };
  return (
    <Chip
      label={labels[status]}
      size="small"
      sx={{
        bgcolor: `${statusColors[status]}15`,
        color: statusColors[status],
        fontWeight: 600,
        fontSize: '0.75rem',
      }}
      {...props}
    />
  );
}

interface PriorityChipProps extends Omit<ChipProps, 'label'> {
  priority: TicketPriority;
}

export function PriorityChip({ priority, ...props }: PriorityChipProps) {
  return (
    <Chip
      label={priority.charAt(0) + priority.slice(1).toLowerCase()}
      size="small"
      sx={{
        bgcolor: `${priorityColors[priority]}15`,
        color: priorityColors[priority],
        fontWeight: 600,
        fontSize: '0.75rem',
      }}
      {...props}
    />
  );
}

interface SentimentChipProps extends Omit<ChipProps, 'label'> {
  sentiment: Sentiment;
}

export function SentimentChip({ sentiment, ...props }: SentimentChipProps) {
  const icons: Record<Sentiment, string> = {
    POSITIVE: '😊',
    NEUTRAL: '😐',
    NEGATIVE: '😟',
    URGENT: '🚨',
  };
  return (
    <Chip
      label={`${icons[sentiment]} ${sentiment.charAt(0) + sentiment.slice(1).toLowerCase()}`}
      size="small"
      sx={{
        bgcolor: `${sentimentColors[sentiment]}15`,
        color: sentimentColors[sentiment],
        fontWeight: 600,
        fontSize: '0.75rem',
      }}
      {...props}
    />
  );
}

interface HealthScoreProps {
  score: number;
  size?: 'small' | 'medium';
}

export function HealthScore({ score, size = 'medium' }: HealthScoreProps) {
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  const label = score >= 70 ? 'Healthy' : score >= 40 ? 'At Risk' : 'Critical';

  return (
    <Chip
      label={`${label} (${score})`}
      size={size}
      sx={{
        bgcolor: `${color}15`,
        color,
        fontWeight: 600,
        fontSize: size === 'small' ? '0.7rem' : '0.75rem',
      }}
    />
  );
}
