import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.baseText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.textPrimary : colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={textStyles}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Racing-specific button variants
interface RaceButtonProps extends Omit<ButtonProps, 'variant'> {
  raceType?: 'join' | 'create' | 'leave' | 'start';
}

export const RaceButton: React.FC<RaceButtonProps> = ({
  raceType = 'join',
  ...props
}) => {
  const getRaceButtonStyle = () => {
    switch (raceType) {
      case 'join':
        return { backgroundColor: colors.success };
      case 'create':
        return { backgroundColor: colors.primary };
      case 'leave':
        return { backgroundColor: colors.warning };
      case 'start':
        return { backgroundColor: colors.racingRed, ...shadows.racingGlow };
      default:
        return {};
    }
  };

  return (
    <Button
      {...props}
      variant="primary"
      style={StyleSheet.flatten([getRaceButtonStyle(), props.style])}
    />
  );
};

// Icon button for minimal actions
interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  size?: number;
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 40,
  color = colors.textSecondary,
  disabled = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        { width: size, height: size },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Base styles
  base: {
    borderRadius: borderRadius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...shadows.sm,
  } as ViewStyle,

  baseText: {
    ...typography.button,
    textAlign: 'center',
  } as TextStyle,

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  iconContainer: {
    marginRight: spacing.xs,
  } as ViewStyle,

  // Variants
  primary: {
    backgroundColor: colors.primary,
  } as ViewStyle,

  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  } as ViewStyle,

  ghost: {
    backgroundColor: 'transparent',
  } as ViewStyle,

  danger: {
    backgroundColor: colors.warning,
  } as ViewStyle,

  success: {
    backgroundColor: colors.success,
  } as ViewStyle,

  // Text variants
  primaryText: {
    color: colors.textPrimary,
  } as TextStyle,

  secondaryText: {
    color: colors.primary,
  } as TextStyle,

  ghostText: {
    color: colors.primary,
  } as TextStyle,

  dangerText: {
    color: colors.textPrimary,
  } as TextStyle,

  successText: {
    color: colors.background,
  } as TextStyle,

  // Sizes
  small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  } as ViewStyle,

  medium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  } as ViewStyle,

  large: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  } as ViewStyle,

  // Size text
  smallText: {
    fontSize: 14,
  } as TextStyle,

  mediumText: {
    fontSize: 16,
  } as TextStyle,

  largeText: {
    fontSize: 18,
  } as TextStyle,

  // States
  disabled: {
    opacity: 0.5,
    backgroundColor: colors.surfaceSecondary,
  } as ViewStyle,

  disabledText: {
    color: colors.textDisabled,
  } as TextStyle,

  fullWidth: {
    alignSelf: 'stretch',
  } as ViewStyle,

  // Icon button
  iconButton: {
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
  } as ViewStyle,
});

export default Button;