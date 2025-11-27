import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { THEMES, COLORS } from '../../constants/theme';

export const ThemedText = ({ style, variant = 'body', children, color, ...props }) => {
  const { style: themeStyle, mode } = useTheme();

  // Font family based on variant
  const fontFamily = variant.includes('headline') || variant === 'title'
    ? 'SpaceGrotesk_700Bold'
    : 'Inter_400Regular';

  // Default color logic
  let textColor = color;
  if (!textColor) {
    if (themeStyle === THEMES.NEOBRUTALISM) {
        textColor = mode === 'dark' ? COLORS.neo.white : COLORS.neo.dark;
    } else {
        textColor = mode === 'dark' ? '#fff' : '#1f2937';
    }
  }

  // Size logic
  let fontSize = 16;
  if (variant === 'headlineLarge') fontSize = 32;
  if (variant === 'headlineMedium') fontSize = 24;
  if (variant === 'title') fontSize = 20;
  if (variant === 'caption') fontSize = 12;

  return (
    <Text style={[{ fontFamily, color: textColor, fontSize }, style]} {...props}>
      {children}
    </Text>
  );
};
