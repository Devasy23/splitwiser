// Modern Add Expense Screen - Following Blueprint Specifications
// Implements the core "Add Expense" journey with glassmorphism and Gen Z UX

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useContext, useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    View
} from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { createExpense, getGroupMembers } from "../api/groups";
import { AuthContext } from "../context/AuthContext";

// Import our modern components
import Button from '../components/core/Button';
import { CurrencyInput, EnhancedTextInput } from '../components/core/Input';
import { ModernHeader } from '../components/navigation/ModernNavigation';
import { GlassCard } from '../utils/cards';
import { borderRadius, colors, spacing, typography } from '../utils/theme';

const { width: screenWidth } = Dimensions.get('window');

const ModernAddExpenseScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const { token, user } = useContext(AuthContext);
  
  // Form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [splitMethod, setSplitMethod] = useState("equal");
  const [payerId, setPayerId] = useState(null);
  
  // Split method states
  const [percentages, setPercentages] = useState({});
  const [shares, setShares] = useState({});
  const [exactAmounts, setExactAmounts] = useState({});
  const [selectedMembers, setSelectedMembers] = useState({});
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const fetchMembers = async () => {
      try {
        const response = await getGroupMembers(groupId);
        setMembers(response.data);
        
        // Initialize split states
        const initialShares = {};
        const initialPercentages = {};
        const initialExactAmounts = {};
        const initialSelectedMembers = {};
        const numMembers = response.data.length;

        // Calculate percentages using integer math to avoid floating-point errors
        const basePercentage = Math.floor(100 / numMembers);
        const remainder = 100 - basePercentage * numMembers;

        response.data.forEach((member, index) => {
          initialShares[member.userId] = "1";

          // Distribute percentages using integer math
          let memberPercentage = basePercentage;
          if (index < remainder) {
            memberPercentage += 1;
          }
          initialPercentages[member.userId] = memberPercentage.toString();
          initialExactAmounts[member.userId] = "0.00";
          initialSelectedMembers[member.userId] = true;
        });
        
        setShares(initialShares);
        setPercentages(initialPercentages);
        setExactAmounts(initialExactAmounts);
        setSelectedMembers(initialSelectedMembers);

        // Set default payer to current user if they're a member
        const currentUserMember = response.data.find(
          (member) => member.userId === user._id
        );
        if (currentUserMember) {
          setPayerId(user._id);
        } else if (response.data.length > 0) {
          setPayerId(response.data[0].userId);
        }
      } catch (error) {
        console.error("Failed to fetch members:", error);
        Alert.alert("Error", "Failed to fetch group members.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (token && groupId) {
      fetchMembers();
    }
  }, [token, groupId]);

  const handleAddExpense = async () => {
    if (!description || !amount) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Missing Information", "Please fill in the expense description and amount.");
      return;
    }

    if (!payerId) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Missing Payer", "Please select who paid for this expense.");
      return;
    }

    setIsSubmitting(true);
    
    // Progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    try {
      const expenseData = {
        description,
        amount: parseFloat(amount),
        paidBy: payerId,
        splitMethod,
        ...(splitMethod === "equal" && { selectedMembers }),
        ...(splitMethod === "percentage" && { percentages }),
        ...(splitMethod === "shares" && { shares }),
        ...(splitMethod === "exact" && { exactAmounts }),
      };

      await createExpense(groupId, expenseData, token);
      
      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Success animation and navigation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.goBack();
      });
      
    } catch (error) {
      console.error("Failed to create expense:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to create expense. Please try again.");
      
      // Reset progress animation
      progressAnim.setValue(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const splitMethods = [
    { value: "equal", label: "Split Equally", icon: "⚖️" },
    { value: "percentage", label: "By Percentage", icon: "📊" },
    { value: "shares", label: "By Shares", icon: "🔢" },
    { value: "exact", label: "Exact Amounts", icon: "💰" },
  ];

  const handleSplitMethodChange = async (method) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSplitMethod(method);
  };

  const handlePayerSelect = async (memberId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPayerId(memberId);
  };

  const toggleMemberSelection = async (memberId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMembers(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[colors.brand.accent, colors.brand.accentAlt]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading group members...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <ModernHeader
        title="Add Expense"
        subtitle="Split bills with your group"
        showBackButton={true}
        navigation={navigation}
        variant="gradient"
      />

      <Animated.View style={[
        styles.content,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Expense Details Card */}
          <GlassCard variant="glass" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>💰 Expense Details</Text>
            
            <EnhancedTextInput
              label="What was this expense for?"
              placeholder="Dinner, groceries, gas..."
              value={description}
              onChangeText={setDescription}
              variant="filled"
              style={styles.input}
            />

            <CurrencyInput
              label="How much did it cost?"
              value={amount}
              onChangeText={setAmount}
              currency="$"
              placeholder="0.00"
              style={styles.input}
            />
          </GlassCard>

          {/* Payer Selection Card */}
          <GlassCard variant="glass" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>👤 Who Paid?</Text>
            
            <View style={styles.payerGrid}>
              {members.map((member) => (
                <TouchableOpacity
                  key={member.userId}
                  onPress={() => handlePayerSelect(member.userId)}
                  style={[
                    styles.payerOption,
                    payerId === member.userId && styles.payerOptionSelected,
                  ]}
                >
                  <View style={[
                    styles.payerAvatar,
                    payerId === member.userId && styles.payerAvatarSelected,
                  ]}>
                    <Text style={styles.payerInitial}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[
                    styles.payerName,
                    payerId === member.userId && styles.payerNameSelected,
                  ]}>
                    {member.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>

          {/* Split Method Card */}
          <GlassCard variant="glass" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📝 How to Split?</Text>
            
            <View style={styles.splitMethodGrid}>
              {splitMethods.map((method) => (
                <TouchableOpacity
                  key={method.value}
                  onPress={() => handleSplitMethodChange(method.value)}
                  style={[
                    styles.splitMethodOption,
                    splitMethod === method.value && styles.splitMethodSelected,
                  ]}
                >
                  <Text style={styles.splitMethodIcon}>{method.icon}</Text>
                  <Text style={[
                    styles.splitMethodLabel,
                    splitMethod === method.value && styles.splitMethodLabelSelected,
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>

          {/* Member Selection for Equal Split */}
          {splitMethod === "equal" && (
            <GlassCard variant="glass" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>👥 Who's Involved?</Text>
              
              <View style={styles.membersList}>
                {members.map((member) => (
                  <TouchableOpacity
                    key={member.userId}
                    onPress={() => toggleMemberSelection(member.userId)}
                    style={styles.memberOption}
                  >
                    <View style={styles.memberInfo}>
                      <View style={[
                        styles.memberAvatar,
                        selectedMembers[member.userId] && styles.memberAvatarSelected,
                      ]}>
                        <Text style={styles.memberInitial}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.memberName}>{member.name}</Text>
                    </View>
                    <View style={[
                      styles.checkbox,
                      selectedMembers[member.userId] && styles.checkboxSelected,
                    ]}>
                      {selectedMembers[member.userId] && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>
          )}

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              title={isSubmitting ? "Creating Expense..." : "Create Expense"}
              onPress={handleAddExpense}
              disabled={isSubmitting}
              loading={isSubmitting}
              variant="primary"
              size="large"
              fullWidth={true}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </Animated.View>

      {/* Progress Bar */}
      {isSubmitting && (
        <Animated.View style={[
          styles.progressBar,
          {
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: '#FFFFFF',
    marginTop: spacing.md,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  payerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  payerOption: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 80,
  },
  payerOptionSelected: {
    backgroundColor: `${colors.brand.accent}15`,
  },
  payerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  payerAvatarSelected: {
    borderColor: colors.brand.accent,
    backgroundColor: `${colors.brand.accent}20`,
  },
  payerInitial: {
    ...typography.label,
    color: colors.text.primary,
  },
  payerName: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  payerNameSelected: {
    color: colors.brand.accent,
    fontWeight: '600',
  },
  splitMethodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  splitMethodOption: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  splitMethodSelected: {
    borderColor: colors.brand.accent,
    backgroundColor: `${colors.brand.accent}10`,
  },
  splitMethodIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  splitMethodLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  splitMethodLabelSelected: {
    color: colors.brand.accent,
    fontWeight: '600',
  },
  membersList: {
    gap: spacing.sm,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  memberAvatarSelected: {
    borderColor: colors.brand.accent,
    backgroundColor: `${colors.brand.accent}20`,
  },
  memberInitial: {
    ...typography.label,
    color: colors.text.primary,
  },
  memberName: {
    ...typography.body,
    color: colors.text.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.brand.accent,
    backgroundColor: colors.brand.accent,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  submitContainer: {
    marginTop: spacing.lg,
  },
  submitButton: {
    minHeight: 56,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: colors.brand.accent,
  },
});

export default ModernAddExpenseScreen;
