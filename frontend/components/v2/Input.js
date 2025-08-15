import React, { useState } from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { colors, spacing, typography } from '../../styles/theme';

const Input = ({ label, error, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  const containerStyle = [
    styles.inputContainer,
    isFocused && styles.focused,
    error && styles.error,
  ];

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={containerStyle}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    height: 30,
  },
  label: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  focused: {
    borderColor: colors.brandAccent,
    shadowColor: colors.brandAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // for Android
  },
  error: {
    borderColor: colors.semanticError,
  },
  errorText: {
    ...typography.caption,
    color: colors.semanticError,
    marginTop: spacing.xs,
  },
});

export default Input;
