/** Premium design tokens — SupportAI design system (Light + Green brand) */
export const tokens = {
  colors: {
    bgDeep: '#F8FAFC',
    bgBase: '#F8FAFC',
    bgElevated: '#FFFFFF',
    bgSurface: '#FFFFFF',
    bgGlass: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(15, 23, 42, 0.08)',
    borderHover: 'rgba(15, 23, 42, 0.14)',
    accent: '#166534',
    accentLight: '#15803D',
    accentMuted: '#22C55E',
    accentBlue: '#059669',
    accentCyan: '#10B981',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    messageAgent: '#F8FAFC',
    messageCustomer: '#FFFFFF',
    messageBorder: 'rgba(15, 23, 42, 0.08)',
  },
  gradients: {
    hero: 'linear-gradient(135deg, #166534 0%, #15803D 35%, #059669 70%, #10B981 100%)',
    mesh:
      'radial-gradient(ellipse 90% 60% at 10% -5%, rgba(148, 163, 184, 0.07) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 90% 5%, rgba(100, 116, 139, 0.05) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(148, 163, 184, 0.04) 0%, transparent 50%)',
    sidebar: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
    button: 'linear-gradient(135deg, #166534 0%, #15803D 50%, #059669 100%)',
    statGlow: (color: string) =>
      `linear-gradient(135deg, ${color}18 0%, transparent 65%)`,
  },
  shadows: {
    card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 4px 16px rgba(15, 23, 42, 0.04)',
    cardHover: '0 4px 20px rgba(22, 101, 52, 0.12), 0 1px 3px rgba(15, 23, 42, 0.06)',
    glow: '0 8px 32px rgba(22, 101, 52, 0.15)',
    dropdown: '0 12px 40px rgba(15, 23, 42, 0.12)',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
} as const;
