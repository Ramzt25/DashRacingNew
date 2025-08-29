// Racing Theme System for Dash Racing
export const colors = {
  // Primary Racing Theme
  primary: '#FF0000',        // Racing Red
  secondary: '#CC0000',      // Dark Red
  accent: '#FF3333',         // Light Red
  warning: '#FF6600',        // Orange warning
  success: '#00FF00',        // Green success
  
  // Dark Theme Base
  background: '#000000',     // Pure Black
  surface: '#1A1A1A',        // Dark Grey
  surfaceSecondary: '#2A2A2A', // Medium Dark Grey
  surfaceElevated: '#3A3A3A', // Elevated Grey
  card: '#1F1F1F',          // Card background
  
  // Text Hierarchy
  textPrimary: '#FFFFFF',    // White
  textSecondary: '#E0E0E0',  // Light Gray
  textTertiary: '#A0A0A0',   // Medium Gray
  textDisabled: '#666666',   // Disabled Gray
  
  // Additional UI Colors
  border: '#333333',         // Border color
  text: '#FFFFFF',           // Default text
  cardBackground: '#1F1F1F', // Card background
  
  // Racing Colors
  racingRed: '#FF0000',
  racingOrange: '#FF6600',
  racingYellow: '#FFCC00',
  racingWhite: '#FFFFFF',
  racingBlue: '#0066FF',
  
  // Status Colors
  online: '#00FF00',
  offline: '#666666',
  racing: '#FF0000',
  waiting: '#FFCC00',
  error: '#FF3333',
  
  // Transparencies
  overlay: 'rgba(0,0,0,0.8)',
  overlayLight: 'rgba(0,0,0,0.4)',
  glass: 'rgba(255,255,255,0.1)',
  cardGlass: 'rgba(255,255,255,0.05)',
  
  // Gradients
  primaryGradient: ['#FF0000', '#CC0000'],
  backgroundGradient: ['#000000', '#1A1A1A'],
  cardGradient: ['#1A1A1A', '#2A2A2A'],
};

export const typography = {
  // Headers
  h1: { 
    fontSize: 32, 
    fontWeight: 'bold' as const, 
    letterSpacing: -0.5,
    lineHeight: 38,
    color: colors.textPrimary 
  },
  h2: { 
    fontSize: 24, 
    fontWeight: 'bold' as const, 
    letterSpacing: -0.25,
    lineHeight: 30,
    color: colors.textPrimary 
  },
  h3: { 
    fontSize: 20, 
    fontWeight: '600' as const, 
    letterSpacing: -0.1,
    lineHeight: 26,
    color: colors.textPrimary 
  },
  h4: { 
    fontSize: 18, 
    fontWeight: '600' as const, 
    letterSpacing: 0,
    lineHeight: 24,
    color: colors.textPrimary 
  },
  
  // Body Text
  body: { 
    fontSize: 16, 
    fontWeight: 'normal' as const, 
    lineHeight: 22,
    color: colors.textPrimary 
  },
  bodySecondary: { 
    fontSize: 14, 
    fontWeight: 'normal' as const, 
    lineHeight: 20,
    color: colors.textSecondary 
  },
  caption: { 
    fontSize: 12, 
    fontWeight: 'normal' as const, 
    lineHeight: 16,
    color: colors.textTertiary 
  },
  
  // UI Elements
  button: { 
    fontSize: 16, 
    fontWeight: '600' as const, 
    letterSpacing: 0.25,
    textTransform: 'uppercase' as const 
  },
  input: { 
    fontSize: 16, 
    fontWeight: 'normal' as const, 
    lineHeight: 22,
    color: colors.textPrimary 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '500' as const, 
    lineHeight: 18,
    color: colors.textSecondary 
  },
  
  // Racing Specific
  speedometer: { 
    fontSize: 48, 
    fontWeight: 'bold' as const, 
    letterSpacing: -1,
    color: colors.primary 
  },
  timer: { 
    fontSize: 32, 
    fontWeight: 'bold' as const, 
    letterSpacing: -0.5,
    fontFamily: 'monospace',
    color: colors.racingYellow 
  },
  position: { 
    fontSize: 24, 
    fontWeight: 'bold' as const, 
    color: colors.racingWhite 
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  
  // Component specific
  cardPadding: 16,
  screenPadding: 20,
  buttonPadding: 12,
  inputPadding: 16,
  headerHeight: 60,
  tabBarHeight: 80,
  
  // Safe area specific
  safeAreaBottom: 80, // Space for tab bar and safe area
  safeAreaTop: 44,    // Space for status bar
  
  // Racing specific
  statsSpacing: 12,
  gaugeSpacing: 20,
  leaderboardSpacing: 8
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
  
  // Component specific
  card: 12,
  button: 8,
  input: 8,
  modal: 16,
  
  // Racing specific
  speedometer: 50,
  badge: 20
};

export const shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    shadowColor: colors.background,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    shadowColor: colors.background,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    shadowColor: colors.background,
  },
  
  // Racing specific - red glow effects
  racingGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
    shadowColor: colors.primary,
  }
};

export const animations = {
  // Duration
  fast: 150,
  normal: 250,
  slow: 400,
  
  // Easing
  easeOut: 'ease-out',
  easeIn: 'ease-in',
  easeInOut: 'ease-in-out',
  
  // Racing specific
  engineRev: 100,
  countdown: 1000,
  raceStart: 200
};

// Theme object combining all design tokens
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  
  // Helper functions
  isDark: true,
  isRacing: true,
  
  // Component variants
  button: {
    primary: {
      backgroundColor: colors.primary,
      color: colors.textPrimary,
    },
    secondary: {
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      borderColor: colors.primary,
      borderWidth: 1,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.primary,
    },
    danger: {
      backgroundColor: colors.warning,
      color: colors.textPrimary,
    },
    success: {
      backgroundColor: colors.success,
      color: colors.background,
    }
  },
  
  card: {
    default: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      padding: spacing.cardPadding,
      ...shadows.sm
    },
    elevated: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: borderRadius.card,
      padding: spacing.cardPadding,
      ...shadows.md
    },
    racing: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      padding: spacing.cardPadding,
      borderColor: colors.primary,
      borderWidth: 1,
      ...shadows.racingGlow
    }
  }
};

export default theme;