/**
 * 设计令牌 - TypeScript 类型定义
 *
 * 提供类型安全的设计令牌访问
 */

// ============================================
// 颜色令牌
// ============================================

export const colorTokens = {
  // 主色调
  primary: 'var(--color-primary)',
  primaryHover: 'var(--color-primary-hover)',
  primaryActive: 'var(--color-primary-active)',
  primaryForeground: 'var(--color-primary-foreground)',

  // 背景色
  background: 'var(--color-background)',
  surface: 'var(--color-surface)',
  surfaceSubtle: 'var(--color-surface-subtle)',

  // 文字色
  text: 'var(--color-text)',
  textSecondary: 'var(--color-text-secondary)',
  textMuted: 'var(--color-text-muted)',

  // 边框色
  border: 'var(--color-border)',
  borderSubtle: 'var(--color-border-subtle)',

  // 语义色
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  info: 'var(--color-info)',
} as const;

// ============================================
// 字体令牌
// ============================================

export const fontSizeTokens = {
  display: 'var(--font-size-display)',
  h1: 'var(--font-size-h1)',
  h2: 'var(--font-size-h2)',
  h3: 'var(--font-size-h3)',
  body: 'var(--font-size-body)',
  small: 'var(--font-size-small)',
  caption: 'var(--font-size-caption)',
} as const;

export const lineHeightTokens = {
  tight: 'var(--line-height-tight)',
  normal: 'var(--line-height-normal)',
  relaxed: 'var(--line-height-relaxed)',
} as const;

export const fontWeightTokens = {
  normal: 'var(--font-weight-normal)',
  medium: 'var(--font-weight-medium)',
  semibold: 'var(--font-weight-semibold)',
  bold: 'var(--font-weight-bold)',
} as const;

// ============================================
// 间距令牌
// ============================================

export const spacingTokens = {
  0: 'var(--spacing-0)',
  '0.5': 'var(--spacing-0-5)',
  1: 'var(--spacing-1)',
  2: 'var(--spacing-2)',
  3: 'var(--spacing-3)',
  4: 'var(--spacing-4)',
  5: 'var(--spacing-5)',
  6: 'var(--spacing-6)',
  8: 'var(--spacing-8)',
  10: 'var(--spacing-10)',
  12: 'var(--spacing-12)',
  16: 'var(--spacing-16)',
} as const;

// ============================================
// 圆角令牌
// ============================================

export const radiusTokens = {
  xs: 'var(--radius-xs)',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  '2xl': 'var(--radius-2xl)',
  full: 'var(--radius-full)',
} as const;

// ============================================
// 阴影令牌
// ============================================

export const shadowTokens = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
} as const;

// ============================================
// 动画令牌
// ============================================

export const durationTokens = {
  fast: 'var(--duration-fast)',
  base: 'var(--duration-base)',
  slow: 'var(--duration-slow)',
} as const;

export const easingTokens = {
  out: 'var(--ease-out)',
  in: 'var(--ease-in)',
  inOut: 'var(--ease-in-out)',
} as const;

// ============================================
// 交互尺寸令牌
// ============================================

export const heightTokens = {
  buttonSm: 'var(--height-button-sm)',
  buttonMd: 'var(--height-button-md)',
  buttonLg: 'var(--height-button-lg)',
  inputSm: 'var(--height-input-sm)',
  inputMd: 'var(--height-input-md)',
} as const;

// ============================================
// 类型定义
// ============================================

export type ColorToken = keyof typeof colorTokens;
export type FontSizeToken = keyof typeof fontSizeTokens;
export type SpacingToken = keyof typeof spacingTokens;
export type RadiusToken = keyof typeof radiusTokens;
export type ShadowToken = keyof typeof shadowTokens;
