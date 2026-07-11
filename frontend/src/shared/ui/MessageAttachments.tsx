import { Box, Chip, Stack, Typography } from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import { attachmentsApi } from '@/shared/api';
import type { Attachment } from '@/shared/types';
import { tokens } from '@/shared/config/design-tokens';

function getAttachmentIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return <PictureAsPdfIcon sx={{ fontSize: 18 }} />;
  if (mimeType.startsWith('image/')) return <ImageIcon sx={{ fontSize: 18 }} />;
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return <DescriptionIcon sx={{ fontSize: 18 }} />;
  }
  return <InsertDriveFileIcon sx={{ fontSize: 18 }} />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MessageAttachmentsProps {
  attachments: Attachment[];
}

export function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  if (!attachments.length) return null;

  const handleDownload = async (attachment: Attachment) => {
    await attachmentsApi.download(attachment.id, attachment.fileName);
  };

  return (
    <Stack direction="row" flexWrap="wrap" gap={0.75} mt={1}>
      {attachments.map((attachment) => (
        <Chip
          key={attachment.id}
          icon={getAttachmentIcon(attachment.mimeType)}
          label={
            <Box sx={{ maxWidth: 180 }}>
              <Typography variant="caption" noWrap display="block" fontWeight={600}>
                {attachment.fileName}
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.colors.textMuted }}>
                {formatFileSize(attachment.size)}
              </Typography>
            </Box>
          }
          onClick={() => void handleDownload(attachment)}
          clickable
          size="small"
          variant="outlined"
          sx={{
            height: 'auto',
            py: 0.5,
            '& .MuiChip-label': { display: 'block', whiteSpace: 'normal' },
          }}
        />
      ))}
    </Stack>
  );
}
