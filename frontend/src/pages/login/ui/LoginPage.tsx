import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  alpha,
} from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SpeedIcon from '@mui/icons-material/Speed';
import BoltIcon from '@mui/icons-material/Bolt';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { authApi } from '@/shared/api';
import { useAuthStore } from '@/shared/lib/stores';
import { getErrorMessage } from '@/shared/api/client';
import { tokens } from '@/shared/config/design-tokens';
import { LogoMark, brandTitleSx } from '@/shared/ui/LogoMark';

const features = [
  { icon: PsychologyIcon, text: 'AI-powered reply suggestions' },
  { icon: BoltIcon, text: 'Real-time sentiment analysis' },
  { icon: SpeedIcon, text: 'Smart ticket routing' },
];

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
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
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left brand panel */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          p: 6,
          position: 'relative',
          overflow: 'hidden',
          background: tokens.colors.bgElevated,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: tokens.gradients.mesh,
            opacity: 0.8,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(148,163,184,0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 440 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            <LogoMark size="lg" />
            <Typography variant="h5" sx={brandTitleSx}>
              SupportAI
            </Typography>
          </Box>
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{ mb: 2, letterSpacing: '-0.03em', lineHeight: 1.15 }}
          >
            Customer support,{' '}
            <Box component="span" sx={{ background: tokens.gradients.hero, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              reimagined
            </Box>
          </Typography>
          <Typography variant="body1" sx={{ color: tokens.colors.textSecondary, mb: 4, lineHeight: 1.7 }}>
            The intelligent support platform with AI copilot, sentiment analysis, and real-time insights.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {features.map(({ icon: Icon, text }) => (
              <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: alpha(tokens.colors.accent, 0.15),
                    border: `1px solid ${alpha(tokens.colors.accent, 0.25)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon sx={{ fontSize: 18, color: tokens.colors.accentLight }} />
                </Box>
                <Typography variant="body2" sx={{ color: tokens.colors.textSecondary }}>
                  {text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right login form */}
      <Box
        sx={{
          flex: { xs: 1, lg: '0 0 480px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 4 },
          background: tokens.colors.bgBase,
          borderLeft: { lg: `1px solid ${tokens.colors.border}` },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1.5, mb: 4, justifyContent: 'center' }}>
            <LogoMark size="md" />
            <Typography variant="h6" sx={brandTitleSx}>SupportAI</Typography>
          </Box>

          <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em" mb={0.5}>
            Welcome back
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.colors.textSecondary, mb: 3 }}>
            Sign in to your dashboard
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: tokens.colors.textMuted, fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: tokens.colors.textMuted, fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 3, py: 1.6 }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: tokens.colors.textSecondary }}>
            No account?{' '}
            <Link component={RouterLink} to="/register" underline="hover" sx={{ color: tokens.colors.accentLight, fontWeight: 600 }}>
              Create one
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
