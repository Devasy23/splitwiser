import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { HelperText, IconButton, Text, TextInput } from 'react-native-paper';
import { hapticFeedback } from './haptics';
import { colors, spacing, typography } from './theme';

// Enhanced TextInput with floating labels and validation
export const EnhancedTextInput = ({
  label,
  value,
  onChangeText,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry = false,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const handleFocus = () => {
    setIsFocused(true);
    hapticFeedback.light();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const toggleSecureEntry = () => {
    setIsSecure(!isSecure);
    hapticFeedback.light();
  };

  return (
    <View style={[styles.inputContainer, style]}>
      <View style={styles.inputWrapper}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          mode="outlined"
          label={label}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isSecure}
          error={!!error}
          style={[
            styles.textInput,
            leftIcon && styles.textInputWithLeftIcon,
            (rightIcon || secureTextEntry) && styles.textInputWithRightIcon,
          ]}
          outlineStyle={{
            borderColor: error ? colors.error : isFocused ? colors.primary : colors.outline,
            borderWidth: isFocused ? 2 : 1,
          }}
          theme={{
            colors: {
              primary: colors.primary,
              error: colors.error,
              outline: colors.outline,
              onSurfaceVariant: colors.onSurfaceVariant,
            },
          }}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={toggleSecureEntry}
          >
            <IconButton
              icon={isSecure ? 'eye-off' : 'eye'}
              iconColor={colors.onSurfaceVariant}
              size={20}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <HelperText type={error ? 'error' : 'info'} visible={!!(error || helperText)}>
          {error || helperText}
        </HelperText>
      )}
    </View>
  );
};

// Currency input with automatic formatting
export const CurrencyInput = ({
  label = "Amount",
  value,
  onChangeText,
  currency = "₹",
  style,
  ...props
}) => {
  const formatValue = (text) => {
    // Remove non-numeric characters except decimal point
    const numericValue = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return numericValue;
  };

  const handleChangeText = (text) => {
    const formattedValue = formatValue(text);
    onChangeText(formattedValue);
  };

  return (
    <EnhancedTextInput
      label={label}
      value={value}
      onChangeText={handleChangeText}
      keyboardType="numeric"
      leftIcon={
        <Text style={styles.currencySymbol}>{currency}</Text>
      }
      style={style}
      {...props}
    />
  );
};

// Search input with clear button
export const SearchInput = ({
  placeholder = "Search...",
  value,
  onChangeText,
  onClear,
  style,
  ...props
}) => {
  const handleClear = () => {
    onChangeText('');
    if (onClear) onClear();
    hapticFeedback.light();
  };

  return (
    <EnhancedTextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      leftIcon={
        <IconButton
          icon="magnify"
          iconColor={colors.onSurfaceVariant}
          size={20}
        />
      }
      rightIcon={
        value ? (
          <IconButton
            icon="close"
            iconColor={colors.onSurfaceVariant}
            size={20}
          />
        ) : null
      }
      onRightIconPress={value ? handleClear : undefined}
      style={style}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  textInputWithLeftIcon: {
    paddingLeft: 48,
  },
  textInputWithRightIcon: {
    paddingRight: 48,
  },
  leftIconContainer: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    position: 'absolute',
    right: 4,
    zIndex: 1,
  },
  currencySymbol: {
    ...typography.body1,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
});
