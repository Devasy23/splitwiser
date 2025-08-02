import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button, TextInput, ActivityIndicator, Appbar, Title, SegmentedButtons, Text, Paragraph, Checkbox } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { getGroupMembers, createExpense } from '../api/groups';

const AddExpenseScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const { token, user } = useContext(AuthContext);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [splitMethod, setSplitMethod] = useState('equal');

  // State for different split methods
  const [percentages, setPercentages] = useState({});
  const [shares, setShares] = useState({});
  const [exactAmounts, setExactAmounts] = useState({});
  const [selectedMembers, setSelectedMembers] = useState({}); // For equal split

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await getGroupMembers(token, groupId);
        setMembers(response.data);
        // Initialize split states
        const initialShares = {};
        const initialPercentages = {};
        const initialExactAmounts = {};
        const initialSelectedMembers = {};
        const numMembers = response.data.length;
        response.data.forEach(member => {
          initialShares[member.userId] = '1';
          initialPercentages[member.userId] = numMembers > 0 ? (100 / numMembers).toFixed(2) : '0';
          initialExactAmounts[member.userId] = '0.00';
          initialSelectedMembers[member.userId] = true; // Select all by default
        });
        setShares(initialShares);
        setPercentages(initialPercentages);
        setExactAmounts(initialExactAmounts);
        setSelectedMembers(initialSelectedMembers);
      } catch (error) {
        console.error('Failed to fetch members:', error);
        Alert.alert('Error', 'Failed to fetch group members.');
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
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    let expenseData;

    try {
        let splits = [];
        let splitType = splitMethod;

        if (splitMethod === 'equal') {
            const includedMembers = Object.keys(selectedMembers).filter(userId => selectedMembers[userId]);
            if (includedMembers.length === 0) {
                throw new Error('You must select at least one member for the split.');
            }
            const splitAmount = numericAmount / includedMembers.length;
            splits = includedMembers.map(userId => ({ userId, amount: splitAmount }));
        } else if (splitMethod === 'exact') {
            const total = Object.values(exactAmounts).reduce((sum, val) => sum + parseFloat(val || '0'), 0);
            if (Math.abs(total - numericAmount) > 0.01) {
                throw new Error(`The exact amounts must add up to ${numericAmount}.`);
            }
            splits = Object.entries(exactAmounts).map(([userId, value]) => ({ userId, amount: parseFloat(value) }));
        } else if (splitMethod === 'percentage') {
            const total = Object.values(percentages).reduce((sum, val) => sum + parseFloat(val || '0'), 0);
            if (Math.abs(total - 100) > 0.01) {
                throw new Error('Percentages must add up to 100%.');
            }
            splits = Object.entries(percentages).map(([userId, value]) => ({
                userId,
                amount: numericAmount * (parseFloat(value) / 100),
            }));
        } else if (splitMethod === 'shares') {
            const totalShares = Object.values(shares).reduce((sum, val) => sum + parseInt(val || '0', 10), 0);
            if (totalShares === 0) {
                throw new Error('Total shares cannot be zero.');
            }
            splits = Object.entries(shares).map(([userId, value]) => ({
                userId,
                amount: numericAmount * (parseInt(value, 10) / totalShares),
            }));
        }

        expenseData = {
            description,
            amount: numericAmount,
            paidBy: user._id,
            splitType,
            splits,
        };

        await createExpense(token, groupId, expenseData);
        Alert.alert('Success', 'Expense added successfully.');
        navigation.goBack();
    } catch (error) {
        Alert.alert('Error', error.message || 'Failed to create expense.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleMemberSelect = (userId) => {
    setSelectedMembers(prev => ({...prev, [userId]: !prev[userId]}));
  };

  const renderSplitInputs = () => {
    const handleSplitChange = (setter, userId, value) => {
        setter(prev => ({ ...prev, [userId]: value }));
    };

    switch (splitMethod) {
      case 'equal':
        return members.map(member => (
            <Checkbox.Item
                key={member.userId}
                label={member.user.name}
                status={selectedMembers[member.userId] ? 'checked' : 'unchecked'}
                onPress={() => handleMemberSelect(member.userId)}
            />
        ));
      case 'exact':
        return members.map(member => (
          <TextInput
            key={member.userId}
            label={`${member.user.name}'s exact amount`}
            value={exactAmounts[member.userId]}
            onChangeText={text => handleSplitChange(setExactAmounts, member.userId, text)}
            keyboardType="numeric"
            style={styles.splitInput}
          />
        ));
      case 'percentage':
        return members.map(member => (
          <TextInput
            key={member.userId}
            label={`${member.user.name}'s percentage`}
            value={percentages[member.userId]}
            onChangeText={text => handleSplitChange(setPercentages, member.userId, text)}
            keyboardType="numeric"
            style={styles.splitInput}
          />
        ));
      case 'shares':
        return members.map(member => (
          <TextInput
            key={member.userId}
            label={`${member.user.name}'s shares`}
            value={shares[member.userId]}
            onChangeText={text => handleSplitChange(setShares, member.userId, text)}
            keyboardType="numeric"
            style={styles.splitInput}
          />
        ));
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Add Expense" />
      </Appbar.Header>
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 32 }}>
        <Title>New Expense Details</Title>
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
        />
        <TextInput
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
          keyboardType="numeric"
        />

        <Title style={styles.splitTitle}>Split Method</Title>
        <SegmentedButtons
          value={splitMethod}
          onValueChange={setSplitMethod}
          buttons={[
            { value: 'equal', label: 'Equally' },
            { value: 'exact', label: 'Exact' },
            { value: 'percentage', label: '%' },
            { value: 'shares', label: 'Shares' },
          ]}
          style={styles.input}
        />

        <View style={styles.splitInputsContainer}>
          {renderSplitInputs()}
        </View>

        <Button
          mode="contained"
          onPress={handleAddExpense}
          style={styles.button}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Add Expense
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 24,
  },
  splitTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  splitInputsContainer: {
    marginTop: 8,
  },
  splitInput: {
    marginBottom: 8,
  }
});

export default AddExpenseScreen;
