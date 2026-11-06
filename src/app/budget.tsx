
import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  router,
  useFocusEffect,
} from "expo-router";

import { useAuth } from "@/context/AuthContext";

import {
  useTheme,
  lightColors,
  darkColors,
} from "@/context/ThemeContext";

import {
  Budget,
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
} from "@/services/budgetService";

// =====================================================
// BUDGET SCREEN
// =====================================================

export default function BudgetScreen() {
  const { token } = useAuth();
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  // PREMIUM THEME
  const navy = "#142B4A";
  const green = "#16A085";
  const coral = "#E76F51";

  // ===================================================
  // BUDGETS
  // ===================================================

  const [budgets, setBudgets] = useState<Budget[]>([]);

  // ===================================================
  // LOADING STATES
  // ===================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // ===================================================
  // FORM
  // ===================================================

  const [month, setMonth] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [amount, setAmount] = useState("");
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // ===================================================
  // MONTHS
  // ===================================================

  const months = [
    { number: "1", name: "January", short: "Jan" },
    { number: "2", name: "February", short: "Feb" },
    { number: "3", name: "March", short: "Mar" },
    { number: "4", name: "April", short: "Apr" },
    { number: "5", name: "May", short: "May" },
    { number: "6", name: "June", short: "Jun" },
    { number: "7", name: "July", short: "Jul" },
    { number: "8", name: "August", short: "Aug" },
    { number: "9", name: "September", short: "Sep" },
    { number: "10", name: "October", short: "Oct" },
    { number: "11", name: "November", short: "Nov" },
    { number: "12", name: "December", short: "Dec" },
  ];

  // ===================================================
  // GET MONTH NAME
  // ===================================================

  const getMonthName = (monthNumber: number | string) => {
    const monthObject = months.find(
      (item) => Number(item.number) === Number(monthNumber)
    );

    return monthObject ? monthObject.name : String(monthNumber);
  };

  // ===================================================
  // FORMAT AMOUNT
  // ===================================================

  const formatAmount = (value: number) => {
    return Number(value || 0).toLocaleString("en-KE", {
      maximumFractionDigits: 2,
    });
  };

  // ===================================================
  // LOAD BUDGETS
  // ===================================================

  const loadBudgets = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await getBudgets(token);

      if (response.success) {
        setBudgets(response.budgets || []);
      } else {
        setBudgets([]);
      }
    } catch (error) {
      console.error("Budget loading error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to load budgets."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // LOAD WHEN SCREEN OPENS
  // ===================================================

  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, [token])
  );

  // ===================================================
  // REFRESH
  // ===================================================

  const refreshBudgets = async () => {
    if (!token) return;

    try {
      setRefreshing(true);

      const response = await getBudgets(token);

      if (response.success) {
        setBudgets(response.budgets || []);
      }
    } catch (error) {
      console.error("Refresh budgets error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to refresh budgets."
      );
    } finally {
      setRefreshing(false);
    }
  };

  // ===================================================
  // RESET FORM
  // ===================================================

  const resetForm = () => {
    setMonth("");
    setYear(String(new Date().getFullYear()));
    setAmount("");
    setEditingBudget(null);
  };

  // ===================================================
  // START EDITING
  // ===================================================

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setMonth(String(budget.month));
    setYear(String(budget.year));
    setAmount(String(budget.budget_amount));
  };

  // ===================================================
  // SAVE BUDGET
  // ===================================================

  const handleSave = async () => {
    if (!token) {
      Alert.alert("Error", "You are not logged in.");
      return;
    }

    if (!month) {
      Alert.alert("Missing month", "Please select the budget month.");
      return;
    }

    const numericMonth = Number(month);

    if (
      Number.isNaN(numericMonth) ||
      numericMonth < 1 ||
      numericMonth > 12
    ) {
      Alert.alert("Invalid month", "Please select a valid month.");
      return;
    }

    if (!year.trim()) {
      Alert.alert("Missing year", "Please enter the budget year.");
      return;
    }

    const numericYear = Number(year);

    if (
      !Number.isInteger(numericYear) ||
      numericYear < 2000 ||
      numericYear > 2100
    ) {
      Alert.alert("Invalid year", "Please enter a valid year.");
      return;
    }

    if (!amount.trim()) {
      Alert.alert("Missing amount", "Please enter the budget amount.");
      return;
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      Alert.alert(
        "Invalid amount",
        "Budget amount must be greater than zero."
      );
      return;
    }

    try {
      setSaving(true);

      const data = {
        month: numericMonth,
        year: numericYear,
        budget_amount: numericAmount,
      };

      if (editingBudget) {
        const response = await updateBudget(
          token,
          editingBudget.id,
          data
        );

        if (!response.success) {
          throw new Error(
            response.message || "Unable to update budget."
          );
        }

        Alert.alert("Success", "Budget updated successfully.");
      } else {
        const response = await createBudget(token, data);

        if (!response.success) {
          throw new Error(
            response.message || "Unable to create budget."
          );
        }

        Alert.alert("Success", "Budget added successfully.");
      }

      resetForm();
      await loadBudgets();
    } catch (error) {
      console.error("Save budget error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to save budget."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // DELETE BUDGET
  // ===================================================

  const handleDelete = (budget: Budget) => {
    const performDelete = async () => {
      if (!token) {
        const message = "Please log in again to delete this budget.";

        if (Platform.OS === "web") {
          window.alert(message);
        } else {
          Alert.alert("Error", message);
        }

        return;
      }

      try {
        const response = await deleteBudget(token, budget.id);

        if (!response.success) {
          throw new Error(
            response.message || "Unable to delete budget."
          );
        }

        if (Platform.OS === "web") {
          window.alert("Budget deleted successfully.");
        } else {
          Alert.alert("Success", "Budget deleted successfully.");
        }

        await loadBudgets();
      } catch (error) {
        console.error("Delete budget error:", error);

        const message =
          error instanceof Error
            ? error.message
            : "Unable to delete budget.";

        if (Platform.OS === "web") {
          window.alert(message);
        } else {
          Alert.alert("Error", message);
        }
      }
    };

    const confirmationMessage =
      `Are you sure you want to delete the ${getMonthName(
        budget.month
      )} ${budget.year} budget?`;

    if (Platform.OS === "web") {
      const confirmed = window.confirm(confirmationMessage);

      if (confirmed) {
        void performDelete();
      }

      return;
    }

    Alert.alert(
      "Delete Budget",
      confirmationMessage,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void performDelete();
          },
        },
      ]
    );
  };

  // ===================================================
  // TOTAL BUDGET
  // ===================================================

  const totalBudget = budgets.reduce(
    (total, budget) =>
      total + Number(budget.budget_amount || 0),
    0
  );

  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={green} />

        <Text
          style={[
            styles.loadingText,
            { color: colors.secondaryText },
          ]}
        >
          Loading budgets...
        </Text>
      </SafeAreaView>
    );
  }

  // ===================================================
  // MAIN SCREEN
  // ===================================================

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshBudgets}
            tintColor={green}
          />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            style={[
              styles.backButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={23}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>
              My Budgets
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: colors.secondaryText },
              ]}
            >
              Plan your monthly spending
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* SUMMARY CARD */}

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>
                Total Planned Budget
              </Text>

              <Text style={styles.summaryAmount}>
                KSh {formatAmount(totalBudget)}
              </Text>
            </View>

            <View style={styles.summaryIcon}>
              <MaterialCommunityIcons
                name="wallet-outline"
                size={29}
                color="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryBottom}>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={17}
              color="#DCE7F5"
            />

            <Text style={styles.summaryCount}>
              {budgets.length} budget
              {budgets.length === 1 ? "" : "s"} created
            </Text>
          </View>
        </View>

        {/* BUDGET FORM */}

        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.formHeading}>
            <View
              style={[
                styles.formIcon,
                { backgroundColor: isDarkMode ? "#174B42" : "#E1F5EF" },
              ]}
            >
              <MaterialCommunityIcons
                name={editingBudget ? "pencil-outline" : "plus"}
                size={23}
                color={green}
              />
            </View>

            <View style={styles.formHeadingText}>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                {editingBudget ? "Edit Budget" : "Create a Budget"}
              </Text>

              <Text
                style={[
                  styles.formSubtitle,
                  { color: colors.secondaryText },
                ]}
              >
                Set a spending limit for a month
              </Text>
            </View>
          </View>

          {/* MONTH */}

          <Text style={[styles.label, { color: colors.text }]}>
            Select Month
          </Text>

          <View style={styles.monthContainer}>
            {months.map((item) => {
              const selected = month === item.number;

              return (
                <Pressable
                  key={item.number}
                  onPress={() => setMonth(item.number)}
                  style={[
                    styles.monthButton,
                    {
                      backgroundColor: selected
                        ? green
                        : isDarkMode
                          ? colors.inputBackground
                          : "#F4F6FA",
                      borderColor: selected
                        ? green
                        : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.monthButtonText,
                      {
                        color: selected
                          ? "#FFFFFF"
                          : colors.text,
                      },
                    ]}
                  >
                    {item.short}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* YEAR */}

          <Text style={[styles.label, { color: colors.text }]}>
            Budget Year
          </Text>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-outline"
              size={21}
              color={colors.secondaryText}
            />

            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g. 2026"
              placeholderTextColor={colors.mutedText}
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>

          {/* AMOUNT */}

          <Text style={[styles.label, { color: colors.text }]}>
            Budget Amount
          </Text>

          <View
            style={[
              styles.inputContainer,
              styles.amountContainer,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={styles.currencyText}>KSh</Text>

            <TextInput
              style={[styles.input, styles.amountInput, { color: colors.text }]}
              placeholder="Enter budget amount"
              placeholderTextColor={colors.mutedText}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          <Text
            style={[
              styles.helperText,
              { color: colors.secondaryText },
            ]}
          >
            Set a realistic amount that you can comfortably spend during
            the selected month.
          </Text>

          {/* SAVE */}

          <Pressable
            style={[
              styles.saveButton,
              saving && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={editingBudget ? "content-save-edit-outline" : "plus-circle-outline"}
                  size={21}
                  color="#FFFFFF"
                />

                <Text style={styles.saveButtonText}>
                  {editingBudget ? "Update Budget" : "Create Budget"}
                </Text>
              </>
            )}
          </Pressable>

          {editingBudget && (
            <Pressable
              style={[
                styles.cancelButton,
                {
                  backgroundColor: isDarkMode
                    ? colors.inputBackground
                    : "#F3F4F6",
                },
              ]}
              onPress={resetForm}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  { color: colors.secondaryText },
                ]}
              >
                Cancel Editing
              </Text>
            </Pressable>
          )}
        </View>

        {/* MY BUDGETS HEADER */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Budgets
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                { color: colors.secondaryText },
              ]}
            >
              Manage your monthly plans
            </Text>
          </View>

          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: isDarkMode ? "#174B42" : "#E1F5EF",
              },
            ]}
          >
            <Text style={[styles.countText, { color: green }]}>
              {budgets.length}
            </Text>
          </View>
        </View>

        {/* EMPTY STATE */}

        {budgets.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconContainer,
                {
                  backgroundColor: isDarkMode ? "#263B54" : "#EAF0FA",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="wallet-plus-outline"
                size={39}
                color={green}
              />
            </View>

            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Budgets Yet
            </Text>

            <Text
              style={[
                styles.emptyText,
                { color: colors.secondaryText },
              ]}
            >
              You haven't created any budgets yet. Start by setting your
              first monthly spending limit above.
            </Text>
          </View>
        ) : (
          /* BUDGET LIST */

          <View style={styles.budgetList}>
            {budgets.map((budget) => (
              <View
                key={budget.id}
                style={[
                  styles.budgetCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.budgetTop}>
                  <View style={styles.budgetMonthRow}>
                    <View
                      style={[
                        styles.budgetIcon,
                        {
                          backgroundColor: isDarkMode
                            ? "#263B54"
                            : "#EAF0FA",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="calendar-month-outline"
                        size={23}
                        color="#4169E1"
                      />
                    </View>

                    <View>
                      <Text
                        style={[
                          styles.budgetMonth,
                          { color: colors.text },
                        ]}
                      >
                        {getMonthName(budget.month)}
                      </Text>

                      <Text
                        style={[
                          styles.budgetYear,
                          { color: colors.secondaryText },
                        ]}
                      >
                        {budget.year}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.budgetAmountContainer}>
                    <Text
                      style={[
                        styles.budgetAmountLabel,
                        { color: colors.secondaryText },
                      ]}
                    >
                      Planned limit
                    </Text>

                    <Text style={[styles.budgetAmount, { color: green }]}>
                      KSh {formatAmount(budget.budget_amount)}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.cardDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                {/* ACTIONS */}

                <View style={styles.actionRow}>
                  <Pressable
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: isDarkMode
                          ? "#263B54"
                          : "#EAF0FA",
                      },
                    ]}
                    onPress={() => handleEdit(budget)}
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={17}
                      color="#4169E1"
                    />

                    <Text style={styles.editButtonText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: isDarkMode
                          ? "#451A1A"
                          : "#FCE8E8",
                      },
                    ]}
                    onPress={() => handleDelete(budget)}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={17}
                      color={coral}
                    />

                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // HEADER

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
    marginLeft: 14,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  headerSpacer: {
    width: 10,
  },

  // SUMMARY

  summaryCard: {
    backgroundColor: "#142B4A",
    borderRadius: 23,
    padding: 22,
    marginBottom: 24,
    elevation: 5,
    shadowColor: "#142B4A",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryLabel: {
    color: "#C8D5E5",
    fontSize: 13,
    fontWeight: "600",
  },

  summaryAmount: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "800",
    marginTop: 9,
  },

  summaryIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    backgroundColor: "#294565",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: "#405571",
    marginTop: 18,
    marginBottom: 14,
  },

  summaryBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  summaryCount: {
    color: "#DCE7F5",
    fontSize: 12,
    fontWeight: "600",
  },

  // FORM

  formCard: {
    borderRadius: 21,
    padding: 19,
    marginBottom: 30,
    borderWidth: 1,
  },

  formHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  formIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  formHeadingText: {
    flex: 1,
    marginLeft: 12,
  },

  formTitle: {
    fontSize: 17,
    fontWeight: "800",
  },

  formSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 19,
    marginBottom: 10,
  },

  // MONTH SELECTOR

  monthContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  monthButton: {
    width: "22%",
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  monthButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // INPUTS

  inputContainer: {
    minHeight: 53,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 11,
  },

  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 13,
  },

  amountContainer: {
    minHeight: 59,
  },

  currencyText: {
    color: "#16A085",
    fontSize: 15,
    fontWeight: "800",
  },

  amountInput: {
    fontSize: 16,
    fontWeight: "700",
  },

  helperText: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },

  // SAVE BUTTON

  saveButton: {
    height: 56,
    borderRadius: 15,
    backgroundColor: "#16A085",
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    elevation: 4,
    shadowColor: "#16A085",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.6,
  },

  cancelButton: {
    height: 47,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  cancelButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // SECTION HEADER

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
  },

  sectionSubtitle: {
    fontSize: 11,
    marginTop: 4,
  },

  countBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  countText: {
    fontSize: 13,
    fontWeight: "800",
  },

  // EMPTY STATE

  emptyCard: {
    borderRadius: 19,
    padding: 27,
    alignItems: "center",
    borderWidth: 1,
  },

  emptyIconContainer: {
    width: 75,
    height: 75,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 9,
  },

  emptyText: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 20,
  },

  // BUDGET LIST

  budgetList: {
    gap: 13,
  },

  budgetCard: {
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
  },

  budgetTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  budgetMonthRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  budgetIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  budgetMonth: {
    fontSize: 15,
    fontWeight: "800",
  },

  budgetYear: {
    fontSize: 11,
    marginTop: 4,
  },

  budgetAmountContainer: {
    alignItems: "flex-end",
    marginLeft: 5,
  },

  budgetAmountLabel: {
    fontSize: 10,
    marginBottom: 5,
  },

  budgetAmount: {
    fontSize: 14,
    fontWeight: "800",
  },

  cardDivider: {
    height: 1,
    marginTop: 16,
    marginBottom: 13,
  },

  // ACTIONS

  actionRow: {
    flexDirection: "row",
    gap: 10,
  },

  actionButton: {
    flex: 1,
    height: 41,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  editButtonText: {
    color: "#4169E1",
    fontSize: 12,
    fontWeight: "800",
  },

  deleteButtonText: {
    color: "#DC5656",
    fontSize: 12,
    fontWeight: "800",
  },

  bottomSpace: {
    height: 20,
  },
});
