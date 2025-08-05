import {
    MD3LightTheme as DefaultTheme,
    useTheme,
} from 'react-native-paper';
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';

export const useAppTheme = () => {
    const { theme } = useMaterial3Theme({ fallback: DefaultTheme });
    return useTheme(theme);
}
