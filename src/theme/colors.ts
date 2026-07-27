// SK Technology Mobile App — Design Tokens
// Matches the web app's dark theme with blue accents

export const Colors = {
  // Backgrounds
  background: '#f3f4f6', // Slightly darker off-white for depth
  bgSurface: '#ffffff',
  bgCard: '#ffffff',
  bgMuted: '#f1f5f9',
  bgHover: '#e5e7eb',
  bgInput: '#ffffff',

  // Foreground
  fgPrimary: '#020617', // Deeper black
  fgSecondary: '#1e293b',
  fgMuted: '#64748b',
  fgDim: '#94a3b8',

  // Brand
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  primaryDark: '#1d4ed8',
  primaryFaint: 'rgba(37, 99, 235, 0.08)',
  primaryGlow: 'rgba(37, 99, 235, 0.25)',

  // Borders
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderBlue: 'rgba(37, 99, 235, 0.3)',

  // Semantic
  success: '#10b981', // Richer emerald
  successFaint: 'rgba(16, 185, 129, 0.1)',
  successBorder: 'rgba(16, 185, 129, 0.2)',

  danger: '#ef4444',
  dangerFaint: 'rgba(239, 68, 68, 0.1)',
  dangerBorder: 'rgba(239, 68, 68, 0.2)',

  warning: '#f59e0b',
  warningFaint: 'rgba(245, 158, 11, 0.1)',
  warningBorder: 'rgba(245, 158, 11, 0.2)',

  info: '#0ea5e9', // Vibrant sky blue
  infoFaint: 'rgba(14, 165, 233, 0.1)',

  purple: '#8b5cf6', // Vibrant violet
  purpleFaint: 'rgba(139, 92, 246, 0.1)',

  // Gradients (start, end)
  gradientBlue: ['#2563eb', '#1e40af'] as const,
  gradientPurple: ['#8b5cf6', '#6d28d9'] as const,
  gradientDark: ['#ffffff', '#f3f4f6'] as const,
  gradientEmerald: ['#10b981', '#047857'] as const,
  gradientTeal: ['#0f766e', '#1e3a8a'] as const,

  // Shadows
  shadowBlue: 'rgba(37, 99, 235, 0.3)',

  // Overlay
  overlay: 'rgba(2, 6, 23, 0.7)',
  overlayLight: 'rgba(2, 6, 23, 0.4)',

  // White with opacity (used carefully in light mode)
  white: '#ffffff',
  white10: 'rgba(2, 6, 23, 0.05)',
  white05: 'rgba(2, 6, 23, 0.02)',
  white20: 'rgba(2, 6, 23, 0.1)',
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
