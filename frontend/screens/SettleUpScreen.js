import { Ionicons } from "@expo/vector-icons";
import { useContext, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, TextInput } from "react-native-paper";
import RNPickerSelect from "react-native-picker-select";
import { recordSettlement } from "../api/groups";
import { AuthContext } from "../context/AuthContext";
import { colors, spacing, typography } from "../styles/theme";

const SettleUpScreen = ({ route, navigation }) => {
  const { groupId, settlement, members } = route.params;
  const { token } = useContext(AuthContext);
  const [fromUser, setFromUser] = useState(settlement.fromUserId);
  const [toUser, setToUser] = useState(settlement.toUserId);
  const [amount, setAmount] = useState(settlement.amount.toString());
  const [isLoading, setIsLoading] = useState(false);

  const memberOptions = members.map((member) => ({
    label: member.user.name,
    value: member.userId,
  }));

  const handleRecordPayment = async () => {
    if (!fromUser || !toUser || !amount) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    const settlementData = {
      payer_id: fromUser,
      payee_id: toUser,
      amount: parseFloat(amount),
    };

    try {
      setIsLoading(true);
      await recordSettlement(groupId, settlementData);
      Alert.alert("Success", "Payment recorded successfully.");
      navigation.goBack();
    } catch (error) {
      console.error("Failed to record settlement:", error);
      Alert.alert("Error", "Failed to record settlement.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settle Up</Text>
      </View>
      <Text style={styles.label}>From</Text>
      <RNPickerSelect
        onValueChange={(value) => setFromUser(value)}
        items={memberOptions}
        style={pickerSelectStyles}
        value={fromUser}
        placeholder={{ label: "Select a member", value: null }}
      />
      <Text style={styles.label}>To</Text>
      <RNPickerSelect
        onValueChange={(value) => setToUser(value)}
        items={memberOptions}
        style={pickerSelectStyles}
        value={toUser}
        placeholder={{ label: "Select a member", value: null }}
      />
      <TextInput
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={handleRecordPayment}
        loading={isLoading}
        style={styles.button}
      >
        Record Payment
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginLeft: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.md,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "purple",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
});

export default SettleUpScreen;
