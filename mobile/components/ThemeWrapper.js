import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEMES, COLORS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ThemeWrapper = ({ children }) => {
  const { style, mode } = useTheme();

  let BackgroundComponent;
  let statusBarColor;

  if (style === THEMES.NEOBRUTALISM) {
    const bgColor = mode === 'dark' ? COLORS.neo.dark : COLORS.neo.lightBg;
    BackgroundComponent = <View style={[styles.container, { backgroundColor: bgColor }]}>{children}</View>;
    statusBarColor = mode === 'dark' ? 'light-content' : 'dark-content';
  } else {
    // Glassmorphism
    const colors = mode === 'dark' ? COLORS.glass.dark : COLORS.glass.light;
    BackgroundComponent = (
      <LinearGradient colors={colors} style={styles.container} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}>
        {children}
      </LinearGradient>
    );
    statusBarColor = mode === 'dark' ? 'light-content' : 'dark-content';
  }

  return (
    <>
        <StatusBar barStyle={statusBarColor} />
        <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
            {BackgroundComponent}
        </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
