
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

import {
  Category,
  getCategories,
} from "@/services/categoryService";

import {
  getTransaction,
  updateTransaction,
  Transaction,
} from "@/services/transactionService";

const GREEN = "#16A085";
const CORAL = "#E76F51";

export default function EditTransactionScreen() {
  const { token } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const params = useLocalSearchParams();
  const transactionId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [type, setType] = useState<"Income" | "Expense">("Expense");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);

  // LOAD TRANSACTION
  const loadTransaction = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (!transactionId) {
      Alert.alert(
        "Error",
        "Transaction ID was not provided.",
        [{ text: "OK", onPress: () => router.back() }]
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await getTransaction(
        token,
        Number(transactionId)
      );

      if (!response.success || !response.transaction) {
        Alert.alert(
          "Transaction Not Found",
          response.message || "The transaction could not be found.",
          [{ text: "OK", onPress: () => router.back() }]
        );
        return;
      }

      const data = response.transaction;

      setTransaction(data);
      setType(data.type === "Income" ? "Income" : "Expense");
      setCategoryId(data.category_id);
      setAmount(String(data.amount));
      setDescription(data.description || "");
      setTransactionDate(
        data.transaction_date
          ? String(data.transaction_date).split("T")[0]
          : ""
      );
    } catch (error) {
      console.error("Load transaction error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to load transaction.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTransaction();
  }, [token, transactionId]);

  // LOAD CATEGORIES
  const loadCategories = async () => {
    if (!token) {
      setLoadingCategories(false);
      return;
    }

    try {
      setLoadingCategories(true);

      const response = await getCategories(token);
      setCategories(response.categories || []);
    } catch (error) {
      console.error("Load categories error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to load categories."
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, [token]);

  // FILTER CATEGORIES
  const filteredCategories = categories.filter(
    (category) => category.type === type
  );

  // CHANGE TRANSACTION TYPE
  const changeType = (newType: "Income" | "Expense") => {
    if (newType === type) return;

    setType(newType);
    setCategoryId(null);
  };

  // SELECT CATEGORY
  const selectCategory = (category: Category) => {
    setCategoryId(category.id);
  };

  // UPDATE TRANSACTION
  const handleUpdate = async () => {
    if (!token) {
      Alert.alert("Error", "You are not logged in.");
      return;
    }

    if (!transactionId) {
      Alert.alert("Error", "Transaction ID is missing.");
      return;
    }

    if (!categoryId) {
      Alert.alert("Missing Category", "Please select a category.");
      return;
    }

    if (!amount.trim()) {
      Alert.alert(
        "Missing Amount",
        "Please enter the transaction amount."
      );
      return;
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid amount greater than zero."
      );
      return;
    }

    if (!transactionDate.trim()) {
      Alert.alert("Missing Date", "Please enter the transaction date.");
      return;
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(transactionDate.trim())) {
      Alert.alert(
        "Invalid Date",
        "Please use the format YYYY-MM-DD."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await updateTransaction(
        token,
        Number(transactionId),
        {
          category_id: categoryId,
          amount: numericAmount,
          description: description.trim(),
          transaction_date: transactionDate.trim(),
        }
      );

      if (!response.success) {
        Alert.alert(
          "Update Failed",
          response.message || "Unable to update transaction."
        );
        return;
      }

      Alert.alert(
        "Success",
        "Transaction updated successfully.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Update transaction error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to update transaction."
      );
    } finally {
      setSaving(false);
    }
  };

  // LOADING SCREEN
  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.loadingIcon}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>

        <Text style={[styles.loadingTitle, { color: colors.text }]}>
          Loading transaction
        </Text>

        <Text style={[styles.loadingSubtitle, { color: colors.secondaryText }]}>
          Please wait while we retrieve your details.
        </Text>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <MaterialCommunityIcons
          name="file-alert-outline"
          size={45}
          color={colors.secondaryText}
        />
        <Text style={[styles.loadingTitle, { color: colors.text }]}>
          Transaction unavailable
        </Text>
        <Pressable
          style={styles.backToHistoryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backToHistoryText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const typeColor = type === "Income" ? GREEN : CORAL;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>
              Edit Transaction
            </Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              Make changes to your record
            </Text>
          </View>

          <View style={{ width: 43 }} />
        </View>

        {/* INTRODUCTION */}
        <View style={styles.introSection}>
          <View style={styles.introIcon}>
            <MaterialCommunityIcons
              name="file-document-edit-outline"
              size={27}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.introText}>
            <Text style={[styles.introTitle, { color: colors.text }]}>
              Update your details
            </Text>
            <Text style={[styles.introDescription, { color: colors.secondaryText }]}>
              Review the information below and save your changes.
            </Text>
          </View>
        </View>

        {/* FORM CARD */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* TRANSACTION TYPE */}
          <Text style={[styles.label, { color: colors.text }]}>
            Transaction Type
          </Text>

          <View style={styles.typeRow}>
            <Pressable
              onPress={() => changeType("Expense")}
              style={[
                styles.typeButton,
                {
                  backgroundColor:
                    type === "Expense"
                      ? CORAL
                      : colors.inputBackground,
                  borderColor:
                    type === "Expense"
                      ? CORAL
                      : colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="arrow-top-right"
                size={22}
                color={type === "Expense" ? "#FFFFFF" : CORAL}
              />
              <Text
                style={[
                  styles.typeText,
                  { color: type === "Expense" ? "#FFFFFF" : colors.text },
                ]}
              >
                Expense
              </Text>
            </Pressable>

            <Pressable
              onPress={() => changeType("Income")}
              style={[
                styles.typeButton,
                {
                  backgroundColor:
                    type === "Income"
                      ? GREEN
                      : colors.inputBackground,
                  borderColor:
                    type === "Income"
                      ? GREEN
                      : colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="arrow-bottom-left"
                size={22}
                color={type === "Income" ? "#FFFFFF" : GREEN}
              />
              <Text
                style={[
                  styles.typeText,
                  { color: type === "Income" ? "#FFFFFF" : colors.text },
                ]}
              >
                Income
              </Text>
            </Pressable>
          </View>

          {/* AMOUNT */}
          <Text style={[styles.label, { color: colors.text }]}>
            Amount
          </Text>

          <View
            style={[
              styles.amountContainer,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.currencyIcon,
                { backgroundColor: `${typeColor}18` },
              ]}
            >
              <MaterialCommunityIcons
                name="cash"
                size={22}
                color={typeColor}
              />
            </View>

            <View style={styles.amountTextContainer}>
              <Text style={[styles.currencyLabel, { color: colors.secondaryText }]}>
                KENYAN SHILLINGS
              </Text>
              <View style={styles.amountInputRow}>
                <Text style={[styles.currency, { color: colors.text }]}>
                  KSh
                </Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedText}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* CATEGORY */}
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.text, marginTop: 0 }]}>
              Category
            </Text>
            <Text style={[styles.optionalText, { color: colors.secondaryText }]}>
              Select one
            </Text>
          </View>

          {loadingCategories ? (
            <View style={styles.categoryLoading}>
              <ActivityIndicator size="small" color={GREEN} />
              <Text style={[styles.helperText, { color: colors.secondaryText }]}>
                Loading categories...
              </Text>
            </View>
          ) : filteredCategories.length === 0 ? (
            <View
              style={[
                styles.emptyCategories,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="shape-outline"
                size={23}
                color={colors.secondaryText}
              />
              <Text style={[styles.helperText, { color: colors.secondaryText }]}>
                No {type.toLowerCase()} categories available.
              </Text>
            </View>
          ) : (
            <View style={styles.categoryContainer}>
              {filteredCategories.map((category) => {
                const selected = categoryId === category.id;

                return (
                  <Pressable
                    key={category.id}
                    onPress={() => selectCategory(category)}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: selected
                          ? `${GREEN}18`
                          : colors.inputBackground,
                        borderColor: selected ? GREEN : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        {
                          color: selected ? GREEN : colors.text,
                        },
                      ]}
                    >
                      {category.category_name}
                    </Text>

                    {selected && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={17}
                        color={GREEN}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* DESCRIPTION */}
          <Text style={[styles.label, { color: colors.text }]}>
            Description
          </Text>

          <View
            style={[
              styles.descriptionContainer,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="text-box-outline"
              size={21}
              color={colors.secondaryText}
              style={styles.descriptionIcon}
            />
            <TextInput
              style={[styles.descriptionInput, { color: colors.text }]}
              placeholder="What was this transaction for?"
              placeholderTextColor={colors.mutedText}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* DATE */}
          <Text style={[styles.label, { color: colors.text }]}>
            Transaction Date
          </Text>

          <View
            style={[
              styles.dateContainer,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={21}
              color={GREEN}
            />
            <TextInput
              style={[styles.dateInput, { color: colors.text }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedText}
              value={transactionDate}
              onChangeText={setTransactionDate}
            />
          </View>

          <Text style={[styles.dateHint, { color: colors.secondaryText }]}>
            Enter the date in year-month-day format.
          </Text>

          {/* SAVE BUTTON */}
          <Pressable
            style={[
              styles.updateButton,
              { backgroundColor: GREEN, opacity: saving ? 0.7 : 1 },
            ]}
            onPress={handleUpdate}
            disabled={saving}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.updateButtonText}>Updating...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons
                  name="content-save-check-outline"
                  size={21}
                  color="#FFFFFF"
                />
                <Text style={styles.updateButtonText}>
                  Save Changes
                </Text>
              </>
            )}
          </Pressable>

          {/* CANCEL BUTTON */}
          <Pressable
            style={[
              styles.cancelButton,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={[styles.cancelText, { color: colors.secondaryText }]}>
              Cancel
            </Text>
          </Pressable>
        </View>

        {/* FOOTER NOTE */}
        <View style={styles.footerNote}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={17}
            color={GREEN}
          />
          <Text style={[styles.footerNoteText, { color: colors.secondaryText }]}>
            Your changes will be saved to your transaction history.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  loadingIcon: {
    marginBottom: 15,
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginTop: 8,
  },
  loadingSubtitle: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  backToHistoryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  backToHistoryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 45,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 11,
    marginTop: 4,
  },
  introSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 13,
  },
  introIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
  },
  introText: {
    flex: 1,
  },
  introTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  introDescription: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  formCard: {
    borderRadius: 20,
    padding: 19,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 21,
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: "row",
    gap: 11,
  },
  typeButton: {
    flex: 1,
    height: 55,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  typeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  amountContainer: {
    minHeight: 78,
    borderRadius: 15,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  currencyIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  amountTextContainer: {
    flex: 1,
  },
  currencyLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  currency: {
    fontSize: 16,
    fontWeight: "800",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    padding: 0,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 10,
  },
  optionalText: {
    fontSize: 10,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  categoryButton: {
    minHeight: 39,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
  },
  categoryLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  emptyCategories: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  helperText: {
    fontSize: 12,
  },
  descriptionContainer: {
    minHeight: 105,
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  descriptionIcon: {
    marginTop: 2,
    marginRight: 9,
  },
  descriptionInput: {
    flex: 1,
    minHeight: 75,
    fontSize: 13,
    padding: 0,
  },
  dateContainer: {
    height: 51,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  dateInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  dateHint: {
    fontSize: 10,
    marginTop: 7,
  },
  updateButton: {
    height: 54,
    borderRadius: 14,
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  cancelButton: {
    height: 49,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  footerNote: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    marginTop: 19,
    paddingHorizontal: 10,
  },
  footerNoteText: {
    fontSize: 10,
    flexShrink: 1,
  },
});
