import { addExpense, getGroupMembers } from '@/api/groups';
import { AuthContext } from '@/context/AuthContext';
import { lightTheme } from '@/styles/theme';
import { spacing } from '@/styles/variables';
import { GroupMember } from '@/types';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
    Appbar,
    Button,
    Card,
    IconButton,
    RadioButton,
    Surface,
    Text,
    TextInput
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AddExpenseScreenProps {
  navigation: any;
  route: {
    params: {
      groupId: string;
    };
  };
}

const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({ navigation, route }) => {
  const { groupId } = route.params;
  const { token, user } = useContext(AuthContext);
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'unequal'>('equal');
  const [customSplits, setCustomSplits] = useState<{ [userId: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const response = await getGroupMembers(token!, groupId);
      const membersData = (response.data as any).members || response.data;
      setMembers(membersData);
      // Initially select all members for equal split
      setSelectedMembers(membersData.map((m: GroupMember) => m.userId));
    } catch (error) {
      console.error('Failed to load members:', error);
      Alert.alert('Error', 'Failed to load group members.');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const updateCustomSplit = (userId: string, value: string) => {
    setCustomSplits(prev => ({
      ...prev,
      [userId]: value
    }));
  };

  const validateInput = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description.');
      return false;
    }
    
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return false;
    }

    if (selectedMembers.length === 0) {
      Alert.alert('Error', 'Please select at least one member to split with.');
      return false;
    }

    if (splitType === 'unequal') {
      const totalCustom = selectedMembers.reduce((sum, userId) => {
        const customAmount = parseFloat(customSplits[userId] || '0');
        return sum + (isNaN(customAmount) ? 0 : customAmount);
      }, 0);
      
      if (Math.abs(totalCustom - amountNum) > 0.01) {
        Alert.alert('Error', 'Custom split amounts must add up to the total amount.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateInput()) return;

    setIsLoading(true);
    try {
      await addExpense(token!, {
        groupId,
        description: description.trim(),
        amount: parseFloat(amount),
        splitType,
        participants: selectedMembers,
        customSplits: splitType === 'unequal' ? customSplits : undefined
      });

      Alert.alert('Success', 'Expense added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Failed to add expense:', error);
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.userId === userId);
    return member?.user?.name || 'Unknown';
  };

  if (isLoadingMembers) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Add Expense" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>Loading members...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Add Expense" />
      </Appbar.Header>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Expense Details */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Expense Details
            </Text>
            
            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              mode="outlined"
              placeholder="What's this expense for?"
            />
            
            <TextInput
              label="Amount (₹)"
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
              mode="outlined"
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </Card.Content>
        </Card>

        {/* Split Type */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Split Type
            </Text>
            
            <RadioButton.Group
              onValueChange={(value) => setSplitType(value as 'equal' | 'unequal')}
              value={splitType}
            >
              <View style={styles.radioOption}>
                <RadioButton value="equal" />
                <Text variant="bodyLarge">Split equally</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="unequal" />
                <Text variant="bodyLarge">Split by exact amounts</Text>
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Members Selection */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Split with ({selectedMembers.length} selected)
            </Text>
            
            <View style={styles.membersContainer}>
              {members.map((member) => {
                const isSelected = selectedMembers.includes(member.userId);
                return (
                  <Surface
                    key={member.userId}
                    style={[
                      styles.memberItem,
                      isSelected && styles.selectedMemberItem
                    ]}
                    elevation={isSelected ? 2 : 0}
                  >
                    <View style={styles.memberInfo}>
                      <IconButton
                        icon={isSelected ? 'check-circle' : 'circle-outline'}
                        size={24}
                        iconColor={isSelected ? lightTheme.colors.primary : lightTheme.colors.outline}
                        onPress={() => toggleMemberSelection(member.userId)}
                      />
                      <Text variant="bodyLarge" style={styles.memberName}>
                        {member.user?.name || 'Unknown'}
                        {member.userId === user?._id ? ' (You)' : ''}
                      </Text>
                    </View>

                    {isSelected && splitType === 'unequal' && (
                      <TextInput
                        style={styles.customSplitInput}
                        mode="outlined"
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        value={customSplits[member.userId] || ''}
                        onChangeText={(value) => updateCustomSplit(member.userId, value)}
                        dense
                      />
                    )}
                  </Surface>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          Add Expense
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: spacing.lg,
    backgroundColor: lightTheme.colors.surface,
  },
  sectionTitle: {
    color: lightTheme.colors.onSurface,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: lightTheme.colors.surface,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  membersContainer: {
    gap: spacing.sm,
  },
  memberItem: {
    padding: spacing.md,
    borderRadius: spacing.sm,
    backgroundColor: lightTheme.colors.surfaceVariant,
  },
  selectedMemberItem: {
    backgroundColor: lightTheme.colors.primaryContainer,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    flex: 1,
    marginLeft: spacing.sm,
    color: lightTheme.colors.onSurface,
  },
  customSplitInput: {
    marginTop: spacing.sm,
    width: 100,
    alignSelf: 'flex-end',
  },
  submitContainer: {
    padding: spacing.lg,
    backgroundColor: lightTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.outline,
  },
  submitButton: {
    backgroundColor: lightTheme.colors.primary,
  },
  submitButtonContent: {
    paddingVertical: spacing.sm,
  },
  bottomSpacing: {
    height: spacing.xxl,
  },
});

export default AddExpenseScreen;
