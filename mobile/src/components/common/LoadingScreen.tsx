import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, typography } from '../../utils/theme';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
  backgroundColor?: string;
  size?: 'small' | 'large';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  showLogo = true,
  backgroundColor = colors.background,
  size = 'large'
}) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {showLogo && (
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🏎️</Text>
          <Text style={styles.brandName}>DASH RACING</Text>
          <Text style={styles.tagline}>Race Anywhere, Meet Anywhere</Text>
        </View>
      )}
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size={size} 
          color={colors.primary} 
          style={styles.spinner}
        />
        <Text style={styles.message}>{message}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      </View>
    </View>
  );
};

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Please wait...'
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.overlayMessage}>{message}</Text>
      </View>
    </View>
  );
};

interface InlineLoadingProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  style?: ViewStyle;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  size = 'small',
  color = colors.primary,
  message,
  style
}) => {
  return (
    <View style={[styles.inlineContainer, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.inlineMessage}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  } as ViewStyle,

  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  } as ViewStyle,

  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
  } as TextStyle,

  brandName: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  } as TextStyle,

  tagline: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    textAlign: 'center',
  } as TextStyle,

  loadingContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  } as ViewStyle,

  spinner: {
    marginBottom: spacing.md,
  } as ViewStyle,

  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  } as TextStyle,

  footer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
  } as ViewStyle,

  progressBar: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  } as ViewStyle,

  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  } as ViewStyle,

  // Overlay styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  } as ViewStyle,

  overlayContent: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 150,
  } as ViewStyle,

  overlayMessage: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'center',
  } as TextStyle,

  // Inline styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  } as ViewStyle,

  inlineMessage: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  } as TextStyle,
});

export default LoadingScreen;