import React, { createContext, useState, useContext, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Snackbar, useTheme } from 'react-native-paper';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info'); // 'info', 'success', 'error'
  const theme = useTheme();

  const showToast = useCallback((msg, toastType = 'info') => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'info':
      default:
        return theme.colors.elevation.level3;
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
      case 'error':
        return '#FFFFFF';
      case 'info':
      default:
        return theme.colors.onSurface;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={hideToast}
        duration={3000}
        style={[styles.snackbar, { backgroundColor: getBackgroundColor() }]}
        action={{
          label: 'Dismiss',
          onPress: hideToast,
          labelStyle: { color: getTextColor() },
        }}
        theme={{ colors: { onSurface: getTextColor(), surface: getBackgroundColor() } }}
      >
        {message}
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 80, // Avoid bottom nav bar
  },
});
