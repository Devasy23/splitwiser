import { Ionicons } from "@expo/vector-icons";
import { useContext, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Button,
  Menu,
  SegmentedButtons,
  TextInput,
} from "react-native-paper";
import { createExpense, getGroupMembers } from "../api/groups";
import { AuthContext } from "../context/AuthContext";
import { colors, spacing, typography } from "../styles/theme";

const CustomCheckbox = ({ label, status, onPress }) => (
  <TouchableOpacity style={styles.checkboxContainer} onPress={onPress}>
    <Ionicons
      name={status === "checked" ? "checkbox" : "square-outline"}
      size={24}
      color={status === "checked" ? colors.primary : colors.textSecondary}
    />
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

const SplitInputRow = ({
  label,
  value,
  onChangeText,
  keyboardType = "numeric",
  disabled = false,
  isPercentage = false,
}) => (
  <View style={styles.splitRow}>
    <Text style={styles.splitLabel}>{label}</Text>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <TextInput
        style={styles.splitInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        disabled={disabled}
        theme={{ colors: { primary: colors.accent } }}
      />
      {isPercentage && <Text style={styles.percentageSymbol}>%</Text>}
    </View>
  </View>
);

const AddExpenseScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const { user } = useContext(AuthContext);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [splitMethod, setSplitMethod] = useState("equal");
  const [payerId, setPayerId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const [percentages, setPercentages] = useState({});
  const [shares, setShares] = useState({});
  const [exactAmounts, setExactAmounts] = useState({});
  const [selectedMembers, setSelectedMembers] = useState({});

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await getGroupMembers(groupId);
        setMembers(response.data);
        const initialShares = {};
        const initialPercentages = {};
        const initialExactAmounts = {};
        const initialSelectedMembers = {};
        const numMembers = response.data.length;
        const basePercentage = Math.floor(100 / numMembers);
        const remainder = 100 - basePercentage * numMembers;

        response.data.forEach((member, index) => {
          initialShares[member.userId] = "1";
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
    if (groupId) {
      fetchMembers();
    }
  }, [groupId]);

  const handleAddExpense = async () => {
    if (!description || !amount || !payerId) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      let splits = [];
      if (splitMethod === "equal") {
        const includedMembers = Object.keys(selectedMembers).filter(
          (userId) => selectedMembers[userId]
        );
        if (includedMembers.length === 0)
          throw new Error("Select at least one member for the split.");
        const splitAmount =
          Math.round((numericAmount / includedMembers.length) * 100) / 100;
        const remainder =
          Math.round(
            (numericAmount - splitAmount * includedMembers.length) * 100
          ) / 100;
        splits = includedMembers.map((userId, index) => ({
          userId,
          amount: index === 0 ? splitAmount + remainder : splitAmount,
          type: "equal",
        }));
      } else if (splitMethod === "exact") {
        const total = Object.values(exactAmounts).reduce(
          (sum, val) => sum + parseFloat(val || "0"),
          0
        );
        if (Math.abs(total - numericAmount) > 0.01)
          throw new Error("Exact amounts must add up to the total.");
        splits = Object.entries(exactAmounts)
          .filter(([, value]) => parseFloat(value || "0") > 0)
          .map(([userId, value]) => ({
            userId,
            amount: parseFloat(value),
            type: "unequal",
          }));
      } else if (splitMethod === "percentage") {
        const totalPercentage = Object.values(percentages).reduce(
          (sum, val) => sum + parseFloat(val || "0"),
          0
        );
        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw new Error("Percentages must add up to 100.");
        }
        splits = Object.entries(percentages)
          .filter(([, value]) => parseFloat(value || "0") > 0)
          .map(([userId, value]) => ({
            userId,
            amount: (numericAmount * parseFloat(value)) / 100,
            type: "percentage",
          }));
      } else if (splitMethod === "shares") {
        const totalShares = Object.values(shares).reduce(
          (sum, val) => sum + parseFloat(val || "0"),
          0
        );
        if (totalShares === 0) {
          throw new Error("Total shares cannot be zero.");
        }
        splits = Object.entries(shares)
          .filter(([, value]) => parseFloat(value || "0") > 0)
          .map(([userId, value]) => ({
            userId,
            amount: (numericAmount * parseFloat(value)) / totalShares,
            type: "shares",
          }));
      }
      const expenseData = {
        description,
        amount: numericAmount,
        paidBy: payerId,
        splitType: splitMethod,
        splits,
      };
      await createExpense(groupId, expenseData);
      Alert.alert("Success", "Expense added successfully.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to create expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMemberSelect = (userId) => {
    setSelectedMembers((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const renderSplitInputs = () => {
    switch (splitMethod) {
      case "equal":
        return members.map((member) => (
          <CustomCheckbox
            key={member.userId}
            label={member.user.name}
            status={selectedMembers[member.userId] ? "checked" : "unchecked"}
            onPress={() => handleMemberSelect(member.userId)}
          />
        ));
      case "exact":
        return members.map((member) => (
          <SplitInputRow
            key={member.userId}
            label={member.user.name}
            value={exactAmounts[member.userId]}
            onChangeText={(text) =>
              setExactAmounts({ ...exactAmounts, [member.userId]: text })
            }
          />
        ));
      case "percentage":
        return members.map((member) => (
          <SplitInputRow
            key={member.userId}
            label={member.user.name}
            value={percentages[member.userId]}
            onChangeText={(text) =>
              setPercentages({ ...percentages, [member.userId]: text })
            }
            isPercentage
          />
        ));
      case "shares":
        return members.map((member) => (
          <SplitInputRow
            key={member.userId}
            label={member.user.name}
            value={shares[member.userId]}
            onChangeText={(text) =>
              setShares({ ...shares, [member.userId]: text })
            }
          />
        ));
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const selectedPayerName =
    members.find((m) => m.userId === payerId)?.user.name || "Select Payer";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Appbar.Header style={{ backgroundColor: colors.primary }}>
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          color={colors.white}
        />
        <Appbar.Content
          title="Add Expense"
          color={colors.white}
          titleStyle={{ ...typography.h2 }}
        />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          theme={{ colors: { primary: colors.accent } }}
        />
        <TextInput
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
          keyboardType="numeric"
          theme={{ colors: { primary: colors.accent } }}
        />

        <View>
          <Text style={styles.label}>Paid by</Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.menuAnchor}
                onPress={() => setMenuVisible(true)}
              >
                <Text style={styles.menuAnchorText}>{selectedPayerName}</Text>
                <Ionicons
                  name="chevron-down-outline"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            }
          >
          {members.map((member) => (
            <Menu.Item
              key={member.userId}
              onPress={() => {
                setPayerId(member.userId);
                setMenuVisible(false);
              }}
              title={member.user.name}
            />
          ))}
        </Menu>
        </View>

        <Text style={styles.splitTitle}>Split Method</Text>
        <SegmentedButtons
          value={splitMethod}
          onValueChange={setSplitMethod}
          buttons={[
            { value: "equal", label: "Equally", icon: "division" },
            { value: "exact", label: "Exact", icon: "currency-usd" },
            { value: "percentage", label: "%", icon: "percent-outline" },
            { value: "shares", label: "Shares", icon: "chart-pie" },
          ]}
          style={styles.input}
          theme={{ colors: { primary: colors.primary } }}
        />

        <View style={styles.splitInputsContainer}>{renderSplitInputs()}</View>

        <Button
          mode="contained"
          onPress={handleAddExpense}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Add Expense
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondary,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
  },
  buttonLabel: {
    ...typography.body,
    color: colors.white,
    fontWeight: "bold",
  },
  splitTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  splitInputsContainer: {
    marginTop: spacing.md,
  },
  menuAnchor: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  menuAnchorText: {
    ...typography.body,
    color: colors.text,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  checkboxLabel: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.md,
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  splitLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  splitInput: {
    width: 100,
    textAlign: "right",
    backgroundColor: colors.white,
  },
  percentageSymbol: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});

export default AddExpenseScreen;
