import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { createExpense, getGroupMembers } from '../api/groups';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography } from '../styles/theme';

// Import new v2 components
import Header from '../components/v2/Header';
import Input from '../components/v2/Input';
import Button from '../components/v2/Button';

const AddExpenseScreen = ({ route }) => {
  const { groupId } = route.params;
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  const [amount, setAmount] = useState('0.00');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [members, setMembers] = useState([]);

  // For simplicity, based on the mockup, we are only implementing an equal split.
  // The logic for other split methods from the original file is removed for now.

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await getGroupMembers(groupId);
        setMembers(response.data);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      }
    };
    if (groupId) {
      fetchMembers();
    }
  }, [groupId]);


  const handleAddExpense = async () => {
    const numericAmount = parseFloat(amount);
    if (!description.trim() || !numericAmount || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid description and amount.');
      return;
    }

    if (members.length === 0) {
      Alert.alert('Error', 'This group has no members to split with.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Defaulting to an equal split among all group members
      const splitAmount = numericAmount / members.length;
      const splits = members.map(member => ({
        userId: member.userId,
        amount: splitAmount,
        type: 'equal',
      }));

      const expenseData = {
        description,
        amount: numericAmount,
        paidBy: user._id, // Assuming the current user is the payer
        splitType: 'equal',
        splits,
      };

      await createExpense(groupId, expenseData);
      Alert.alert('Success', 'Expense added successfully.');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create expense:', error);
      Alert.alert('Error', 'Failed to create expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Header
        title="Add Expense"
        leftAction={{
          icon: <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />,
          onPress: () => navigation.goBack(),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <Input
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
          />
        </View>

        <View style={styles.detailsContainer}>
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="What is this for?"
            />
            {/* The "Split with" and "Category" are simplified based on the mockup.
                For a real implementation, these would navigate to other screens
                to select members or categories. */}
            <TouchableOpacity style={styles.detailRow}>
                <Ionicons name="people-outline" size={24} color={colors.textSecondary} />
                <Text style={styles.detailText}>Split equally with everyone</Text>
            </TouchableOpacity>
             <TouchableOpacity style={styles.detailRow}>
                <Ionicons name="pricetag-outline" size={24} color={colors.textSecondary} />
                <Text style={styles.detailText}>Uncategorized</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title="Add Expense"
          onPress={handleAddExpense}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 100, // Header height
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  currencySymbol: {
    ...typography.h1,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  amountInput: {
    ...typography.h1,
    fontSize: 60,
    color: colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderSubtle,
    padding: spacing.sm,
    minWidth: 150,
    textAlign: 'center'
  },
  detailsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    padding: spacing.md,
    borderRadius: 12,
  },
  detailText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.neutral.white,
  },
});

export default AddExpenseScreen;
