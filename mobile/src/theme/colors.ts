// SK Technology Mobile App — Design Tokens
// Matches the web app's dark theme with blue accents

export const Colors = {
  // Backgrounds
  background: '#f8fafc',
  bgSurface: '#ffffff',
  bgCard: '#ffffff',
  bgMuted: '#f1f5f9',
  bgHover: '#e2e8f0',
  bgInput: '#ffffff',

  // Foreground
  fgPrimary: '#0f172a',
  fgSecondary: '#334155',
  fgMuted: '#64748b',
  fgDim: '#94a3b8',

  // Brand
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  primaryDark: '#1d4ed8',
  primaryFaint: 'rgba(37, 99, 235, 0.1)',
  primaryGlow: 'rgba(37, 99, 235, 0.2)',

  // Borders
  border: '#e2e8f0',
  borderLight: '#cbd5e1',
  borderBlue: 'rgba(37, 99, 235, 0.3)',

  // Semantic
  success: '#22c55e',
  successFaint: 'rgba(34, 197, 94, 0.1)',
  successBorder: 'rgba(34, 197, 94, 0.2)',

  danger: '#ef4444',
  dangerFaint: 'rgba(239, 68, 68, 0.1)',
  dangerBorder: 'rgba(239, 68, 68, 0.2)',

  warning: '#f59e0b',
  warningFaint: 'rgba(245, 158, 11, 0.1)',
  warningBorder: 'rgba(245, 158, 11, 0.2)',

  info: '#06b6d4',
  infoFaint: 'rgba(6, 182, 212, 0.1)',

  purple: '#a855f7',
  purpleFaint: 'rgba(168, 85, 247, 0.1)',

  // Gradients (start, end)
  gradientBlue: ['#2563eb', '#1d4ed8'] as const,
  gradientDark: ['#ffffff', '#f8fafc'] as const,

  // Shadows
  shadowBlue: 'rgba(37, 99, 235, 0.25)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // White with opacity (used carefully in light mode)
  white: '#ffffff',
  white10: 'rgba(15, 23, 42, 0.05)',
  white05: 'rgba(15, 23, 42, 0.02)',
  white20: 'rgba(15, 23, 42, 0.1)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
  card: 28,
  button: 18,
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  title: 28,
  hero: 36,
};
