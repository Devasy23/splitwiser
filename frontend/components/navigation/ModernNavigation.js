// Enhanced Navigation Components - Following Blueprint Specifications
// Implements modern tab bar and navigation patterns for Gen Z UX

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Dimensions,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {
    colors,
    shadows,
    spacing,
    typography
} from '../../utils/theme';

const { width: screenWidth } = Dimensions.get('window');

// Modern Tab Bar Component
const ModernTabBar = ({ 
  state, 
  descriptors, 
  navigation,
  style,
}) => {
  return (
    <View style={[
      {
        backgroundColor: colors.glass.background,
        borderTopWidth: 1,
        borderTopColor: colors.glass.border,
        paddingBottom: spacing.sm,
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.md,
      },
      style
    ]}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

          const isFocused = state.index === index;

          const onPress = async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Tab configuration
          const getTabConfig = (routeName) => {
            switch (routeName) {
              case 'Home':
                return { icon: '🏠', label: 'Home' };
              case 'Groups':
                return { icon: '👥', label: 'Groups' };
              case 'AddExpense':
                return { icon: '➕', label: 'Add', isSpecial: true };
              case 'Activity':
                return { icon: '📊', label: 'Activity' };
              case 'Profile':
                return { icon: '👤', label: 'Profile' };
              default:
                return { icon: '•', label: routeName };
            }
          };

          const tabConfig = getTabConfig(route.name);

          // Special handling for Add button (center button)
          if (tabConfig.isSpecial) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginHorizontal: spacing.sm,
                }}
              >
                <LinearGradient
                  colors={[colors.brand.accent, colors.brand.accentAlt]}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...shadows.medium,
                  }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={{
                    fontSize: 24,
                    color: '#FFFFFF',
                  }}>
                    {tabConfig.icon}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          // Regular tab items
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.xs,
              }}
            >
              {/* Icon */}
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isFocused 
                  ? `${colors.brand.accent}20` 
                  : 'transparent',
                marginBottom: 4,
              }}>
                <Text style={{
                  fontSize: 20,
                  opacity: isFocused ? 1 : 0.6,
                }}>
                  {tabConfig.icon}
                </Text>
              </View>

              {/* Label */}
              <Text style={{
                fontSize: typography.caption.fontSize,
                fontFamily: typography.caption.fontFamily,
                color: isFocused 
                  ? colors.brand.accent 
                  : colors.text.secondary,
                fontWeight: isFocused ? '600' : '400',
              }}>
                {tabConfig.label}
              </Text>

              {/* Active indicator */}
              {isFocused && (
                <View style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.brand.accent,
                  marginTop: 2,
                }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Header Component with glassmorphism
const ModernHeader = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  showBackButton = false,
  navigation,
  variant = 'default', // default, transparent, gradient
  style,
}) => {
  const handleBackPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.goBack();
  };

  const getHeaderStyle = () => {
    switch (variant) {
      case 'transparent':
        return {
          backgroundColor: 'transparent',
        };
      case 'gradient':
        return {
          // Will be wrapped in LinearGradient
        };
      default:
        return {
          backgroundColor: colors.glass.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.glass.border,
        };
    }
  };

  const headerContent = (
    <View style={[
      {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 64,
      },
      getHeaderStyle(),
      style,
    ]}>
      {/* Left Section */}
      <View style={{ 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center' 
      }}>
        {showBackButton && (
          <TouchableOpacity
            onPress={handleBackPress}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.glass.background,
              marginRight: spacing.md,
            }}
          >
            <Text style={{ fontSize: 20 }}>←</Text>
          </TouchableOpacity>
        )}
        
        {leftAction}
      </View>

      {/* Center Section */}
      <View style={{ 
        flex: 2, 
        alignItems: 'center' 
      }}>
        <Text style={{
          ...typography.h2,
          color: colors.text.primary,
          textAlign: 'center',
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{
            ...typography.caption,
            color: colors.text.secondary,
            textAlign: 'center',
            marginTop: 2,
          }}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right Section */}
      <View style={{ 
        flex: 1, 
        alignItems: 'flex-end' 
      }}>
        {rightAction}
      </View>
    </View>
  );

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={[colors.brand.accent, colors.brand.accentAlt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {headerContent}
      </LinearGradient>
    );
  }

  return headerContent;
};

// Action Button for headers and floating actions
const ActionButton = ({
  icon,
  label,
  onPress,
  variant = 'default', // default, primary, ghost
  size = 'medium', // small, medium, large
  style,
}) => {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  const sizeConfig = {
    small: { width: 32, height: 32, fontSize: 16 },
    medium: { width: 40, height: 40, fontSize: 20 },
    large: { width: 48, height: 48, fontSize: 24 },
  };

  const variantConfig = {
    default: {
      backgroundColor: colors.glass.background,
      borderColor: colors.glass.border,
      iconColor: colors.text.primary,
    },
    primary: {
      backgroundColor: colors.brand.accent,
      borderColor: colors.brand.accent,
      iconColor: '#FFFFFF',
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      iconColor: colors.text.secondary,
    },
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        {
          width: currentSize.width,
          height: currentSize.height,
          borderRadius: currentSize.width / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: currentVariant.backgroundColor,
          borderWidth: variant !== 'ghost' ? 1 : 0,
          borderColor: currentVariant.borderColor,
          ...shadows.small,
        },
        style,
      ]}
    >
      {typeof icon === 'string' ? (
        <Text style={{
          fontSize: currentSize.fontSize,
          color: currentVariant.iconColor,
        }}>
          {icon}
        </Text>
      ) : (
        icon
      )}
      
      {label && (
        <Text style={{
          ...typography.caption,
          color: currentVariant.iconColor,
          marginTop: 2,
          textAlign: 'center',
        }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Floating Action Button
const FloatingActionButton = ({
  icon = '➕',
  onPress,
  position = 'bottom-right', // bottom-right, bottom-left, bottom-center
  style,
}) => {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress?.();
  };

  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute',
      bottom: spacing.xl,
      zIndex: 1000,
    };

    switch (position) {
      case 'bottom-left':
        return { ...baseStyle, left: spacing.lg };
      case 'bottom-center':
        return { 
          ...baseStyle, 
          left: (screenWidth / 2) - 28, // Center minus half button width
        };
      default: // bottom-right
        return { ...baseStyle, right: spacing.lg };
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        getPositionStyle(),
        style,
      ]}
    >
      <LinearGradient
        colors={[colors.brand.accent, colors.brand.accentAlt]}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.large,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={{
          fontSize: 24,
          color: '#FFFFFF',
        }}>
          {icon}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export {
    ActionButton,
    FloatingActionButton, ModernHeader, ModernTabBar
};

