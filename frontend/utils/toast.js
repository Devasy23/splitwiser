import { createContext, useContext, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Snackbar, Text } from 'react-native-paper';
import { hapticFeedback } from './haptics';
import { borderRadius, colors, spacing, typography } from './theme';

const { width } = Dimensions.get('window');

// Toast context for global state management
const ToastContext = createContext();

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = TOAST_TYPES.INFO, duration = 4000) => {
    // Trigger appropriate haptic feedback
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        hapticFeedback.success();
        break;
      case TOAST_TYPES.ERROR:
        hapticFeedback.error();
        break;
      case TOAST_TYPES.WARNING:
        hapticFeedback.warning();
        break;
      default:
        hapticFeedback.light();
    }

    setToast({
      message,
      type,
      duration,
      visible: true,
    });
  };

  const hideToast = () => {
    setToast(prev => prev ? { ...prev, visible: false } : null);
  };

  const getToastStyle = (type) => {
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return {
          backgroundColor: colors.success,
          textColor: 'white',
          icon: '✅',
        };
      case TOAST_TYPES.ERROR:
        return {
          backgroundColor: colors.error,
          textColor: 'white',
          icon: '❌',
        };
      case TOAST_TYPES.WARNING:
        return {
          backgroundColor: colors.warning,
          textColor: 'white',
          icon: '⚠️',
        };
      default:
        return {
          backgroundColor: colors.primary,
          textColor: 'white',
          icon: 'ℹ️',
        };
    }
  };

  const toastStyle = toast ? getToastStyle(toast.type) : {};

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {toast && (
        <Snackbar
          visible={toast.visible}
          onDismiss={hideToast}
          duration={toast.duration}
          style={[
            styles.snackbar,
            { backgroundColor: toastStyle.backgroundColor }
          ]}
          action={{
            label: 'Dismiss',
            onPress: hideToast,
            textColor: toastStyle.textColor,
          }}
        >
          <View style={styles.toastContent}>
            <Text style={styles.toastIcon}>{toastStyle.icon}</Text>
            <Text style={[styles.toastMessage, { color: toastStyle.textColor }]}>
              {toast.message}
            </Text>
          </View>
        </Snackbar>
      )}
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { showToast, hideToast } = context;

  return {
    showToast,
    hideToast,
    showSuccess: (message, duration) => showToast(message, TOAST_TYPES.SUCCESS, duration),
    showError: (message, duration) => showToast(message, TOAST_TYPES.ERROR, duration),
    showWarning: (message, duration) => showToast(message, TOAST_TYPES.WARNING, duration),
    showInfo: (message, duration) => showToast(message, TOAST_TYPES.INFO, duration),
  };
};

// Pre-built toast messages for common scenarios
export const TOAST_MESSAGES = {
  SUCCESS: {
    GROUP_CREATED: 'Group created successfully! 🎉',
    GROUP_JOINED: 'Successfully joined the group! 🎉',
    EXPENSE_ADDED: 'Expense added successfully! 💰',
    EXPENSE_UPDATED: 'Expense updated successfully! ✅',
    EXPENSE_DELETED: 'Expense deleted successfully! 🗑️',
    PROFILE_UPDATED: 'Profile updated successfully! ✨',
    SETTLEMENT_COMPLETED: 'Settlement completed! 🎊',
  },
  ERROR: {
    NETWORK_ERROR: 'Network error. Please check your connection! 📡',
    INVALID_CODE: 'Invalid group code. Please try again! ❌',
    INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction! 💳',
    PERMISSION_DENIED: 'Permission denied! 🚫',
    GENERIC_ERROR: 'Something went wrong. Please try again! ⚠️',
  },
  WARNING: {
    UNSAVED_CHANGES: 'You have unsaved changes! ⚠️',
    LOW_BALANCE: 'Your balance is running low! 💰',
    OFFLINE_MODE: 'You are currently offline! 📱',
  },
  INFO: {
    LOADING: 'Loading... ⏳',
    SYNC_COMPLETE: 'Data synced successfully! 🔄',
    FEATURE_COMING_SOON: 'This feature is coming soon! 🚀',
  },
};

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: spacing.lg,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    maxWidth: width - (spacing.md * 2),
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  toastMessage: {
    ...typography.body1,
    fontWeight: '500',
    flex: 1,
  },
});
