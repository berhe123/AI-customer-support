import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, TextField, Button, Typography, Link, Alert } from '@mui/material';
import { authApi } from '@/shared/api';
import { useAuthStore } from '@/shared/lib/stores';
import { getErrorMessage } from '@/shared/api/client';
import { tokens } from '@/shared/config/design-tokens';
import { LogoMark, brandTitleSx } from '@/shared/ui/LogoMark';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register({ name, email, password });
      const { user, token } = res.data.data!;
      setAuth(user, token);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: tokens.colors.bgBase,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 440,
          p: 4,
          borderRadius: '20px',
          bgcolor: tokens.colors.bgSurface,
          border: `1px solid ${tokens.colors.border}`,
          boxShadow: tokens.shadows.card,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ display: 'inline-flex', mb: 2 }}>
            <LogoMark size="lg" />
          </Box>
          <Typography variant="h4" sx={{ ...brandTitleSx, mb: 0.5 }}>
            Create account
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.colors.textSecondary, mt: 0.5 }}>
            Join SupportAI today
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField fullWidth label="Full Name" value={name} onChange={(e) => setName(e.target.value)} margin="normal" required />
          <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required />
          <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required helperText="Minimum 8 characters" />
          <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 3, py: 1.6 }}>
            {loading ? 'Creating...' : 'Create account'}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: tokens.colors.textSecondary }}>
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" underline="hover" sx={{ color: tokens.colors.accentLight, fontWeight: 600 }}>
            Sign in
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
