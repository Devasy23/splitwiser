import { StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { borderRadius, colors } from './theme';

// Consistent icon button with theme support
export const ThemedIconButton = ({
  icon,
  size = 24,
  onPress,
  variant = 'default', // default, primary, success, warning, error
  disabled = false,
  style,
  ...props
}) => {
  const getIconStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primaryLight,
          iconColor: colors.primary,
        };
      case 'success':
        return {
          backgroundColor: colors.successLight,
          iconColor: colors.success,
        };
      case 'warning':
        return {
          backgroundColor: colors.warningLight,
          iconColor: colors.warning,
        };
      case 'error':
        return {
          backgroundColor: colors.errorLight,
          iconColor: colors.error,
        };
      default:
        return {
          backgroundColor: colors.surfaceVariant,
          iconColor: colors.onSurfaceVariant,
        };
    }
  };

  const iconStyle = getIconStyle();

  return (
    <IconButton
      icon={icon}
      size={size}
      iconColor={disabled ? colors.onSurfaceMuted : iconStyle.iconColor}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.iconButton,
        {
          backgroundColor: disabled ? colors.outlineVariant : iconStyle.backgroundColor,
        },
        style,
      ]}
      {...props}
    />
  );
};

// Action button with different variants
export const ActionButton = ({
  icon,
  onPress,
  variant = 'primary',
  size = 'medium', // small, medium, large
  disabled = false,
  style,
  ...props
}) => {
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40, iconSize: 18 };
      case 'large':
        return { width: 64, height: 64, iconSize: 32 };
      default:
        return { width: 48, height: 48, iconSize: 24 };
    }
  };

  const sizeStyle = getSizeStyle();

  return (
    <ThemedIconButton
      icon={icon}
      size={sizeStyle.iconSize}
      onPress={onPress}
      variant={variant}
      disabled={disabled}
      style={[
        {
          width: sizeStyle.width,
          height: sizeStyle.height,
          borderRadius: sizeStyle.width / 2,
        },
        style,
      ]}
      {...props}
    />
  );
};

// Status indicators
export const StatusIcon = ({ status, size = 20 }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'settled':
        return { icon: 'check-circle', color: colors.success };
      case 'owed':
        return { icon: 'arrow-up-circle', color: colors.warning };
      case 'owes':
        return { icon: 'arrow-down-circle', color: colors.error };
      case 'pending':
        return { icon: 'clock-outline', color: colors.onSurfaceVariant };
      case 'admin':
        return { icon: 'crown', color: colors.primary };
      default:
        return { icon: 'help-circle', color: colors.onSurfaceVariant };
    }
  };

  const config = getStatusConfig();

  return (
    <IconButton
      icon={config.icon}
      size={size}
      iconColor={config.color}
      style={styles.statusIcon}
    />
  );
};

// Currency icons
export const CurrencyIcon = ({ currency = 'INR', size = 16 }) => {
  const getCurrencyIcon = () => {
    switch (currency) {
      case 'USD':
        return 'currency-usd';
      case 'EUR':
        return 'currency-eur';
      case 'GBP':
        return 'currency-gbp';
      case 'INR':
      default:
        return 'currency-inr';
    }
  };

  return (
    <IconButton
      icon={getCurrencyIcon()}
      size={size}
      iconColor={colors.primary}
      style={styles.currencyIcon}
    />
  );
};

// Feature icons with consistent styling
export const FeatureIcon = ({ feature, size = 24 }) => {
  const getFeatureIcon = () => {
    switch (feature) {
      case 'groups':
        return 'account-group';
      case 'expenses':
        return 'receipt';
      case 'friends':
        return 'account-multiple';
      case 'settings':
        return 'cog';
      case 'profile':
        return 'account-circle';
      case 'notifications':
        return 'bell';
      case 'help':
        return 'help-circle';
      case 'feedback':
        return 'message-star';
      case 'share':
        return 'share-variant';
      case 'export':
        return 'download';
      case 'import':
        return 'upload';
      case 'sync':
        return 'sync';
      case 'security':
        return 'shield-check';
      case 'privacy':
        return 'eye-off';
      default:
        return 'circle';
    }
  };

  return (
    <ThemedIconButton
      icon={getFeatureIcon()}
      size={size}
      variant="primary"
    />
  );
};

const styles = StyleSheet.create({
  iconButton: {
    borderRadius: borderRadius.md,
  },
  statusIcon: {
    margin: 0,
  },
  currencyIcon: {
    margin: 0,
  },
});
