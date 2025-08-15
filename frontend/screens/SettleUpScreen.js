import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Animated, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '../styles/theme';
import { formatCurrency } from '../utils/currency';

// Import new v2 components
import Header from '../components/v2/Header';
import Button from '../components/v2/Button';

const { width, height } = Dimensions.get('window');

const ConfettiPiece = ({ onAnimationComplete }) => {
    const position = useRef(new Animated.ValueXY({ x: Math.random() * width, y: -20 })).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const angle = useRef(new Animated.Value(0)).current;
    const spin = angle.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', `${Math.random() * 360}deg`],
    });

    useEffect(() => {
        Animated.parallel([
            Animated.timing(position, {
                toValue: { x: Math.random() * width, y: height + 20 },
                duration: 3000 + Math.random() * 2000,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 3000,
                useNativeDriver: true,
            }),
             Animated.timing(angle, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
            })
        ]).start(onAnimationComplete);
    }, []);

    const style = {
        transform: [{ translateX: position.x }, { translateY: position.y }, { rotate: spin }],
        opacity: opacity,
        width: 10,
        height: 10,
        backgroundColor: ['#8B5CF6', '#22D3EE', '#10B981', '#F59E0B'][Math.floor(Math.random() * 4)],
        position: 'absolute',
    };

    return <Animated.View style={style} />;
};


const SettleUpScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { fromUser, toUser, amount } = route.params;
  const [showConfetti, setShowConfetti] = useState(false);

  const handleRecordPayment = () => {
    setShowConfetti(true);
    setTimeout(() => {
        Alert.alert(
          "Payment Recorded",
          `You have recorded a cash payment of ${formatCurrency(amount)} to ${toUser.name}.`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
    }, 500); // Give a little time for confetti to appear
  };

  const handlePayWithCard = () => {
      Alert.alert("Feature Not Implemented", "Paying with a card is not yet supported.");
  }

  return (
    <View style={styles.container}>
      <Header
        title="Settle Up"
        leftAction={{
          icon: <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />,
          onPress: () => navigation.goBack(),
        }}
      />
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{toUser.name.charAt(0)}</Text>
        </View>
        <Text style={styles.prompt}>You pay</Text>
        <Text style={styles.recipientName}>{toUser.name}</Text>
        <Text style={styles.amount}>{formatCurrency(amount)}</Text>
      </View>
      <View style={styles.footer}>
        <Button
          title="Record Cash Payment"
          onPress={handleRecordPayment}
          mode="primary"
          style={{ marginBottom: spacing.md }}
        />
        <Button
          title="Pay with 💳"
          onPress={handlePayWithCard}
          mode="secondary"
        />
      </View>
      {showConfetti && Array.from({ length: 50 }).map((_, index) => (
          <ConfettiPiece key={index} onAnimationComplete={() => { if(index === 49) setShowConfetti(false)}} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.genZExpression.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarText: {
    ...typography.h1,
    color: colors.neutral.white,
  },
  prompt: {
    ...typography.body,
    color: colors.textSecondary,
  },
  recipientName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginVertical: spacing.sm,
  },
  amount: {
    ...typography.h1,
    fontSize: 60,
    color: colors.brandAccent,
    marginVertical: spacing.md,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.neutral.white,
  },
});

export default SettleUpScreen;
