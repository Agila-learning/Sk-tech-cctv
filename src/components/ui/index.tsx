import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Radius, Spacing, FontSizes } from '../../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: Colors.primary };
      case 'secondary':
        return { backgroundColor: Colors.bgMuted, borderWidth: 1, borderColor: Colors.border };
      case 'danger':
        return { backgroundColor: Colors.danger };
      case 'success':
        return { backgroundColor: Colors.success };
      case 'ghost':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border };
      default:
        return { backgroundColor: Colors.primary };
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 10, paddingHorizontal: 16 };
      case 'md':
        return { paddingVertical: 14, paddingHorizontal: 20 };
      case 'lg':
        return { paddingVertical: 18, paddingHorizontal: 28 };
    }
  };

  const getTextColor = (): string => {
    if (variant === 'ghost' || variant === 'secondary') return Colors.fgPrimary;
    return '#ffffff';
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        getVariantStyle(),
        getSizeStyle(),
        fullWidth && { width: '100%' },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, padded = true }) => (
  <TouchableOpacity activeOpacity={1} style={[styles.card, padded && styles.cardPadded, style]}>
    {children}
  </TouchableOpacity>
);

interface BadgeProps {
  label: string;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'gray';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, color = 'blue', size = 'sm' }) => {
  const colorMap = {
    blue: { bg: Colors.primaryFaint, text: Colors.primaryLight, border: Colors.borderBlue },
    green: { bg: Colors.successFaint, text: Colors.success, border: Colors.successBorder },
    red: { bg: Colors.dangerFaint, text: Colors.danger, border: Colors.dangerBorder },
    amber: { bg: Colors.warningFaint, text: Colors.warning, border: Colors.warningBorder },
    purple: { bg: Colors.purpleFaint, text: Colors.purple, border: 'rgba(168,85,247,0.2)' },
    gray: { bg: Colors.bgMuted, text: Colors.fgMuted, border: Colors.border },
  };

  const c = colorMap[color];

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={[
        styles.badge,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          paddingVertical: size === 'sm' ? 4 : 6,
          paddingHorizontal: size === 'sm' ? 10 : 14,
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: c.text, fontSize: size === 'sm' ? 9 : 11 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, onPress }) => (
  <TouchableOpacity
    style={styles.statCard}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <TouchableOpacity
      activeOpacity={1}
      style={[styles.statIcon, { backgroundColor: color + '15' }]}
    >
      {icon}
    </TouchableOpacity>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </TouchableOpacity>
);

interface InputFieldProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
}

export const InputField: React.FC<InputFieldProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  icon,
  rightIcon,
  onRightIconPress,
  multiline,
  numberOfLines,
}) => (
  <TouchableOpacity activeOpacity={1} style={styles.inputContainer}>
    {icon && <TouchableOpacity activeOpacity={1} style={styles.inputIcon}>{icon}</TouchableOpacity>}
    <Text style={{ display: 'none' }}>{/* wrapper */}</Text>
    {React.createElement(
      require('react-native').TextInput,
      {
        style: [
          styles.input,
          icon ? { paddingLeft: 48 } : { paddingLeft: 20 },
          rightIcon ? { paddingRight: 48 } : {},
          multiline ? { height: (numberOfLines || 3) * 22, textAlignVertical: 'top' as const } : {},
        ],
        placeholder,
        placeholderTextColor: Colors.fgDim,
        value,
        onChangeText,
        secureTextEntry,
        keyboardType,
        multiline,
        numberOfLines,
      }
    )}
    {rightIcon && (
      <TouchableOpacity style={styles.inputRightIcon} onPress={onRightIconPress}>
        {rightIcon}
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);

export const LoadingScreen: React.FC = () => (
  <TouchableOpacity activeOpacity={1} style={styles.loadingScreen}>
    <ActivityIndicator color={Colors.primary} size="large" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.button,
    gap: 8,
  },
  text: {
    fontSize: FontSizes.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  disabled: {
    opacity: 0.5,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardPadded: {
    padding: Spacing.xl,
  },
  badge: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  statCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    flex: 1,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
    color: Colors.fgMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: FontSizes.xxl,
    fontWeight: '900',
    color: Colors.fgPrimary,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    paddingRight: 20,
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.fgPrimary,
  },
  inputRightIcon: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
