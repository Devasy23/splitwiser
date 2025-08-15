import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useContext, useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View
} from 'react-native';
import {
    getGroupExpenses,
    getGroupMembers,
    getOptimizedSettlements
} from '../api/groups';
import { ModernButton } from '../components/core/Button';
import { FloatingActionButton, ModernHeader } from '../components/navigation/ModernNavigation';
import { AuthContext } from '../context/AuthContext';
import { ExpenseCard, GlassCard } from '../utils/cards';
import { theme } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const ModernGroupDetailsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const { token, user } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animated values
  const scrollY = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);

  const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

  const fetchData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setIsLoading(true);

      const [membersResponse, expensesResponse, settlementsResponse] = 
        await Promise.all([
          getGroupMembers(groupId),
          getGroupExpenses(groupId),
          getOptimizedSettlements(groupId),
        ]);

      setMembers(membersResponse.data);
      setExpenses(expensesResponse.data.expenses || []);
      setSettlements(settlementsResponse.data.optimizedSettlements || []);
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

    } catch (error) {
      console.error('Failed to fetch group details:', error);
      Alert.alert('Error', 'Failed to fetch group details.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token && groupId) {
      fetchData();
    }
  }, [token, groupId]);

  const getMemberName = (userId) => {
    const member = members.find((m) => m.userId === userId);
    return member ? member.user.name : 'Unknown';
  };

  const calculateUserBalance = () => {
    let totalOwed = 0;
    let totalToReceive = 0;
    
    expenses.forEach(expense => {
      const userSplit = expense.splits.find(s => s.userId === user._id);
      const userShare = userSplit ? userSplit.amount : 0;
      const paidByMe = (expense.paidBy || expense.createdBy) === user._id;
      const net = paidByMe ? expense.amount - userShare : -userShare;
      
      if (net > 0) totalToReceive += net;
      else if (net < 0) totalOwed += Math.abs(net);
    });

    return { totalOwed, totalToReceive };
  };

  const renderBalanceOverview = () => {
    const { totalOwed, totalToReceive } = calculateUserBalance();
    const netBalance = totalToReceive - totalOwed;

    return (
      <Animated.View 
        style={[
          styles.balanceContainer,
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={[theme.colors.accent.primary, theme.colors.accent.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceGradient}
        >
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <Text style={[
              styles.balanceAmount,
              { color: netBalance >= 0 ? '#10B981' : '#EF4444' }
            ]}>
              {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
            </Text>
            <Text style={styles.balanceSubtext}>
              {netBalance > 0 
                ? "You're owed money" 
                : netBalance < 0 
                ? "You owe money"
                : "You're all settled up!"
              }
            </Text>
          </View>
        </LinearGradient>

        {/* Quick stats */}
        <View style={styles.quickStats}>
          <GlassCard variant="outlined" style={styles.statCard}>
            <MaterialCommunityIcons 
              name="trending-up" 
              size={24} 
              color={theme.colors.accent.primary} 
            />
            <Text style={styles.statValue}>{formatCurrency(totalToReceive)}</Text>
            <Text style={styles.statLabel}>You'll receive</Text>
          </GlassCard>
          
          <GlassCard variant="outlined" style={styles.statCard}>
            <MaterialCommunityIcons 
              name="trending-down" 
              size={24} 
              color={theme.colors.semantic.warning} 
            />
            <Text style={styles.statValue}>{formatCurrency(totalOwed)}</Text>
            <Text style={styles.statLabel}>You owe</Text>
          </GlassCard>
        </View>
      </Animated.View>
    );
  };

  const renderExpenseItem = (expense, index) => {
    const userSplit = expense.splits.find(s => s.userId === user._id);
    const userShare = userSplit ? userSplit.amount : 0;
    const paidByMe = (expense.paidBy || expense.createdBy) === user._id;
    const net = paidByMe ? expense.amount - userShare : -userShare;

    return (
      <Animated.View
        key={expense._id}
        style={[
          styles.expenseItem,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              })
            }]
          }
        ]}
      >
        <ExpenseCard
          title={expense.description}
          amount={expense.amount}
          paidBy={getMemberName(expense.paidBy || expense.createdBy)}
          userShare={userShare}
          isPaidByUser={paidByMe}
          date={new Date(expense.createdAt)}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Navigate to expense details if needed
          }}
        />
      </Animated.View>
    );
  };

  const handleAddExpense = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AddExpense', { groupId });
  };

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchData(true);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[theme.colors.background.primary, theme.colors.background.secondary]}
          style={styles.loadingContainer}
        >
          <Animated.View 
            style={[
              styles.loadingContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <MaterialCommunityIcons 
              name="loading" 
              size={48} 
              color={theme.colors.accent.primary}
              style={{ marginBottom: theme.spacing.md }}
            />
            <Text style={styles.loadingText}>Loading group details...</Text>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={styles.gradient}
      >
        <ModernHeader
          title={groupName}
          onBack={() => navigation.goBack()}
          rightAction={{
            icon: 'cog',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('GroupSettings', { groupId });
            }
          }}
        />

        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        >
          {renderBalanceOverview()}

          {/* Expenses Section */}
          <View style={styles.expensesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
              <Text style={styles.sectionSubtitle}>
                {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {expenses.length === 0 ? (
              <GlassCard variant="outlined" style={styles.emptyCard}>
                <MaterialCommunityIcons 
                  name="receipt-outline" 
                  size={48} 
                  color={theme.colors.text.secondary}
                  style={{ marginBottom: theme.spacing.md }}
                />
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptyText}>
                  Add your first expense to start tracking group spending
                </Text>
                <ModernButton
                  title="Add First Expense"
                  variant="primary"
                  size="small"
                  onPress={handleAddExpense}
                  style={{ marginTop: theme.spacing.md }}
                />
              </GlassCard>
            ) : (
              <View style={styles.expensesList}>
                {expenses.map((expense, index) => renderExpenseItem(expense, index))}
              </View>
            )}
          </View>
        </Animated.ScrollView>

        <FloatingActionButton
          icon="plus"
          onPress={handleAddExpense}
          style={styles.fab}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  balanceContainer: {
    marginBottom: theme.spacing.xl,
  },
  balanceGradient: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  balanceContent: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: theme.typography.medium,
    marginBottom: theme.spacing.xs,
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: theme.typography.bold,
    marginBottom: theme.spacing.xs,
  },
  balanceSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: theme.typography.regular,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: theme.typography.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.medium,
    marginTop: theme.spacing.xs,
  },
  expensesSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.typography.bold,
    color: theme.colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.medium,
  },
  expensesList: {
    gap: theme.spacing.md,
  },
  expenseItem: {
    marginBottom: theme.spacing.sm,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: theme.typography.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
  },
});

export default ModernGroupDetailsScreen;
