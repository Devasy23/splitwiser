import React from 'react';
import { TextInput, View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { THEMES, COLORS } from '../../constants/theme';
import { ThemedText } from './ThemedText';

export const ThemedInput = ({ label, value, onChangeText, secureTextEntry, style, ...props }) => {
  const { style: themeStyle, mode } = useTheme();

  const isNeo = themeStyle === THEMES.NEOBRUTALISM;
  const isDark = mode === 'dark';

  const containerStyle = [
      styles.container,
      isNeo ? {
          backgroundColor: isDark ? COLORS.neo.dark : COLORS.neo.white,
          borderWidth: 2,
          borderColor: isDark ? COLORS.neo.white : COLORS.neo.dark,
          borderRadius: 0,
          shadowColor: isDark ? COLORS.neo.white : COLORS.neo.dark,
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 0,
      } : {
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
      },
      style
  ];

  const inputStyle = {
      fontFamily: 'Inter_400Regular',
      fontSize: 16,
      color: isDark ? 'white' : 'black',
      paddingVertical: 12,
      paddingHorizontal: 16,
  };

  const placeholderColor = isDark ? '#aaa' : '#666';

  return (
    <View style={{ marginBottom: 16 }}>
        {label && <ThemedText variant="caption" style={{ marginBottom: 6, fontWeight: 'bold' }}>{label}</ThemedText>}
        <View style={containerStyle}>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                placeholderTextColor={placeholderColor}
                style={inputStyle}
                {...props}
            />
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
