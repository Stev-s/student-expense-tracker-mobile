import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  getTransactions,
  deleteTransaction,
  Transaction,
} from "@/services/transactionService";

export default function TransactionsScreen() {
  const { token } = useAuth();
  const { colors, isDarkMode: isDark } = useTheme();

  // Shared application palette
  const NAVY = "#142B4A";
  const GREEN = "#16A085";
  const EXPENSE = "#E76F51";
  const PALE_GREEN = isDark ? "#143D35" : "#E4F6F0";
  const PALE_NAVY = isDark ? "#203957" : "#EAF1F8";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] =
    useState<"All" | "Income" | "Expense">("All");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const incomeColor = GREEN;
  const expenseColor = EXPENSE;

  const loadTransactions = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getTransactions(token);

      if (response.success) {
        setTransactions(response.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Transaction history error:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to load transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  const applySearchAndFilters = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await getTransactions(token);

      if (!response.success) {
        setTransactions([]);
        return;
      }

      const allTransactions = response.transactions || [];
      const search = searchText.trim().toLowerCase();
      const category = categoryFilter.trim().toLowerCase();
      const start = startDate.trim();
      const end = endDate.trim();

      const filteredTransactions = allTransactions.filter(
        (transaction) => {
          const description = String(
            transaction.description || ""
          ).toLowerCase();

          const transactionCategory = String(
            transaction.category_name || ""
          ).toLowerCase();

          const transactionType = String(
            transaction.type || ""
          ).toLowerCase();

          const transactionDate = String(
            transaction.transaction_date || ""
          ).slice(0, 10);

          const matchesSearch =
            !search ||
            description.includes(search) ||
            transactionCategory.includes(search);

          const matchesCategory =
            !category || transactionCategory.includes(category);

          const matchesType =
            selectedType === "All" ||
            transactionType === selectedType.toLowerCase();

          const matchesStartDate =
            !start || transactionDate >= start;

          const matchesEndDate =
            !end || transactionDate <= end;

          return (
            matchesSearch &&
            matchesCategory &&
            matchesType &&
            matchesStartDate &&
            matchesEndDate
          );
        }
      );

      setTransactions(filteredTransactions);
    } catch (error) {
      console.error("Search/filter error:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to search transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = async () => {
    setSearchText("");
    setSelectedType("All");
    setCategoryFilter("");
    setStartDate("");
    setEndDate("");

    if (!token) return;

    try {
      setLoading(true);
      const response = await getTransactions(token);

      if (response.success) {
        setTransactions(response.transactions || []);
      }
    } catch (error) {
      console.error("Clear filters error:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to load transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshTransactions = async () => {
    if (!token) return;

    try {
      setRefreshing(true);
      const response = await getTransactions(token);

      if (response.success) {
        setTransactions(response.transactions || []);
      }
    } catch (error) {
      console.error("Refresh error:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to refresh transactions."
      );
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [token])
  );

  const handleDelete = async (transaction: Transaction) => {
    if (!token) return;

    if (typeof window !== "undefined") {
      const isConfirmed = window.confirm(
        `Are you sure you want to delete this ${transaction.type?.toLowerCase() || ""} transaction?`
      );

      if (isConfirmed) {
        try {
          setLoading(true);
          const response = await deleteTransaction(
            token,
            transaction.id
          );

          if (response.success) {
            await loadTransactions();
            window.alert("Transaction deleted successfully.");
          } else {
            window.alert(
              response.message || "Unable to delete transaction."
            );
          }
        } catch (error) {
          console.error("Delete transaction error:", error);
          window.alert(
            error instanceof Error
              ? error.message
              : "Unable to delete transaction."
          );
        } finally {
          setLoading(false);
        }
      }
      return;
    }

    Alert.alert(
      "Delete Transaction",
      `Are you sure you want to delete this ${transaction.type?.toLowerCase() || ""} transaction?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const response = await deleteTransaction(
                token,
                transaction.id
              );

              if (response.success) {
                await loadTransactions();
                Alert.alert(
                  "Success",
                  "Transaction deleted successfully."
                );
              } else {
                Alert.alert(
                  "Error",
                  response.message || "Unable to delete transaction."
                );
              }
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Unable to delete transaction."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (transaction: Transaction) => {
    router.push({
      pathname: "/edit-transaction",
      params: {
        id: transaction.id.toString(),
      },
    });
  };

  const formatDate = (date: string) => {
    if (!date) return "";

    const transactionDate = new Date(date);

    if (Number.isNaN(transactionDate.getTime())) {
      return date;
    }

    return transactionDate.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return Number(amount || 0).toLocaleString("en-KE");
  };

  const isIncome = (transaction: Transaction) => {
    return transaction.type === "Income";
  };

  const totalIncome = transactions.reduce(
    (total, transaction) =>
      transaction.type === "Income"
        ? total + Number(transaction.amount || 0)
        : total,
    0
  );

  const totalExpense = transactions.reduce(
    (total, transaction) =>
      transaction.type === "Expense"
        ? total + Number(transaction.amount || 0)
        : total,
    0
  );

  const activeFilterCount = [
    selectedType !== "All",
    categoryFilter.trim() !== "",
    startDate.trim() !== "",
    endDate.trim() !== "",
  ].filter(Boolean).length;

  const cardBackground = colors.card;
  const inputBackground = colors.inputBackground;

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={GREEN} />
        <Text
          style={[
            styles.loadingText,
            { color: colors.secondaryText },
          ]}
        >
          Loading transactions...
        </Text>
      </SafeAreaView>
    );
  }

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
            onRefresh={refreshTransactions}
            tintColor={GREEN}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={[
              styles.backButton,
              {
                backgroundColor: cardBackground,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>
              Transaction History
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: colors.secondaryText },
              ]}
            >
              Manage and track your money
            </Text>
          </View>

          <Pressable
            style={[
              styles.headerAddButton,
              { backgroundColor: GREEN },
            ]}
            onPress={() => router.push("/add-transaction")}
          >
            <MaterialCommunityIcons
              name="plus"
              size={23}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        {/* SUMMARY CARD */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: NAVY },
          ]}
        >
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>
                TRANSACTION OVERVIEW
              </Text>
              <Text style={styles.summaryNumber}>
                {transactions.length}
              </Text>
              <Text style={styles.summaryCaption}>
                {transactions.length === 1
                  ? "Transaction found"
                  : "Transactions found"}
              </Text>
            </View>

            <View style={styles.summaryIcon}>
              <MaterialCommunityIcons
                name="wallet-outline"
                size={30}
                color="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryBottom}>
            <View style={styles.summaryAmountBlock}>
              <View style={styles.summaryAmountHeading}>
                <MaterialCommunityIcons
                  name="arrow-down-circle-outline"
                  size={16}
                  color="#B9F5D8"
                />
                <Text style={styles.summaryAmountLabel}>
                  Income
                </Text>
              </View>
              <Text style={styles.summaryIncome}>
                + KSh {formatAmount(totalIncome)}
              </Text>
            </View>

            <View style={styles.summaryAmountBlock}>
              <View style={styles.summaryAmountHeading}>
                <MaterialCommunityIcons
                  name="arrow-up-circle-outline"
                  size={16}
                  color="#FFD1C5"
                />
                <Text style={styles.summaryAmountLabel}>
                  Expenses
                </Text>
              </View>
              <Text style={styles.summaryExpense}>
                - KSh {formatAmount(totalExpense)}
              </Text>
            </View>
          </View>
        </View>

        {/* SEARCH */}
        <View
          style={[
            styles.searchCard,
            {
              backgroundColor: cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={23}
            color={colors.secondaryText}
          />

          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search description or category..."
            placeholderTextColor={colors.secondaryText}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={applySearchAndFilters}
          />

          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")}>
              <MaterialCommunityIcons
                name="close-circle"
                size={19}
                color={colors.secondaryText}
              />
            </Pressable>
          )}

          <Pressable
            style={[
              styles.searchButton,
              { backgroundColor: GREEN },
            ]}
            onPress={applySearchAndFilters}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={19}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        {/* FILTER TOGGLE */}
        <Pressable
          style={[
            styles.filterToggle,
            {
              backgroundColor: cardBackground,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <View style={styles.filterToggleLeft}>
            <View
              style={[
                styles.filterIconBox,
                { backgroundColor: PALE_GREEN },
              ]}
            >
              <MaterialCommunityIcons
                name="tune-variant"
                size={21}
                color={GREEN}
              />
            </View>

            <View>
              <Text
                style={[
                  styles.filterTitle,
                  { color: colors.text },
                ]}
              >
                Filters
              </Text>
              <Text
                style={[
                  styles.filterSubtitle,
                  { color: colors.secondaryText },
                ]}
              >
                Refine your transaction list
              </Text>
            </View>

            {activeFilterCount > 0 && (
              <View
                style={[
                  styles.filterCount,
                  { backgroundColor: GREEN },
                ]}
              >
                <Text style={styles.filterCountText}>
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </View>

          <MaterialCommunityIcons
            name={showFilters ? "chevron-up" : "chevron-down"}
            size={23}
            color={colors.secondaryText}
          />
        </Pressable>

        {/* FILTER PANEL */}
        {showFilters && (
          <View
            style={[
              styles.filterCard,
              {
                backgroundColor: cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.panelTitle,
                { color: colors.text },
              ]}
            >
              Filter Transactions
            </Text>

            <Text
              style={[
                styles.fieldLabel,
                { color: colors.text },
              ]}
            >
              Transaction Type
            </Text>

            <View style={styles.typeRow}>
              {(["All", "Income", "Expense"] as const).map(
                (type) => {
                  const selected = selectedType === type;
                  const activeColor =
                    type === "Income"
                      ? incomeColor
                      : type === "Expense"
                        ? expenseColor
                        : GREEN;

                  return (
                    <Pressable
                      key={type}
                      style={[
                        styles.typeButton,
                        {
                          backgroundColor: selected
                            ? activeColor
                            : inputBackground,
                          borderColor: selected
                            ? activeColor
                            : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedType(type)}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          {
                            color: selected
                              ? "#FFFFFF"
                              : colors.text,
                          },
                        ]}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>

            <Text
              style={[
                styles.fieldLabel,
                { color: colors.text },
              ]}
            >
              Category
            </Text>

            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: inputBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="shape-outline"
                size={19}
                color={colors.secondaryText}
              />
              <TextInput
                style={[
                  styles.filterInput,
                  { color: colors.text },
                ]}
                placeholder="e.g. Food"
                placeholderTextColor={colors.secondaryText}
                value={categoryFilter}
                onChangeText={setCategoryFilter}
              />
            </View>

            <Text
              style={[
                styles.fieldLabel,
                { color: colors.text },
              ]}
            >
              Date Range
            </Text>

            <View style={styles.dateRow}>
              <View style={styles.dateInputBlock}>
                <Text
                  style={[
                    styles.dateLabel,
                    { color: colors.secondaryText },
                  ]}
                >
                  From
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: inputBackground,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="calendar-start"
                    size={17}
                    color={colors.secondaryText}
                  />
                  <TextInput
                    style={[
                      styles.dateInput,
                      { color: colors.text },
                    ]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.secondaryText}
                    value={startDate}
                    onChangeText={setStartDate}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.dateInputBlock}>
                <Text
                  style={[
                    styles.dateLabel,
                    { color: colors.secondaryText },
                  ]}
                >
                  To
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: inputBackground,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="calendar-end"
                    size={17}
                    color={colors.secondaryText}
                  />
                  <TextInput
                    style={[
                      styles.dateInput,
                      { color: colors.text },
                    ]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.secondaryText}
                    value={endDate}
                    onChangeText={setEndDate}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>

            <Text
              style={[
                styles.dateHint,
                { color: colors.secondaryText },
              ]}
            >
              Enter dates in YYYY-MM-DD format.
            </Text>

            <View style={styles.filterActions}>
              <Pressable
                style={[
                  styles.applyButton,
                  { backgroundColor: GREEN },
                ]}
                onPress={applySearchAndFilters}
              >
                <MaterialCommunityIcons
                  name="filter-check"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.applyButtonText}>
                  Apply Filters
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.clearButton,
                  {
                    backgroundColor: inputBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={clearFilters}
              >
                <Text
                  style={[
                    styles.clearButtonText,
                    { color: colors.text },
                  ]}
                >
                  Clear All
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ADD TRANSACTION */}
        <Pressable
          style={[
            styles.addButton,
            { backgroundColor: GREEN },
          ]}
          onPress={() => router.push("/add-transaction")}
        >
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={21}
            color="#FFFFFF"
          />
          <Text style={styles.addButtonText}>
            Add New Transaction
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={19}
            color="#FFFFFF"
          />
        </Pressable>

        {/* LIST HEADER */}
        <View style={styles.listHeader}>
          <View>
            <Text
              style={[
                styles.listTitle,
                { color: colors.text },
              ]}
            >
              Recent Transactions
            </Text>
            <Text
              style={[
                styles.listSubtitle,
                { color: colors.secondaryText },
              ]}
            >
              Your recorded financial activities
            </Text>
          </View>

          <View
            style={[
              styles.listCount,
              { backgroundColor: PALE_GREEN },
            ]}
          >
            <Text
              style={[
                styles.listCountText,
                { color: GREEN },
              ]}
            >
              {transactions.length}
            </Text>
          </View>
        </View>

        {/* EMPTY STATE */}
        {transactions.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconBox,
                { backgroundColor: PALE_GREEN },
              ]}
            >
              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={35}
                color={GREEN}
              />
            </View>

            <Text
              style={[
                styles.emptyTitle,
                { color: colors.text },
              ]}
            >
              No Transactions Found
            </Text>

            <Text
              style={[
                styles.emptyText,
                { color: colors.secondaryText },
              ]}
            >
              No transactions match your current search or filter
              settings. Try changing your filters or add a new transaction.
            </Text>

            <Pressable
              style={[
                styles.emptyButton,
                { backgroundColor: GREEN },
              ]}
              onPress={clearFilters}
            >
              <Text style={styles.emptyButtonText}>
                Clear Filters
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={[
              styles.transactionCard,
              {
                backgroundColor: cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            {transactions.map((transaction, index) => {
              const income = isIncome(transaction);
              const accent = income ? incomeColor : expenseColor;

              return (
                <View
                  key={transaction.id}
                  style={[
                    styles.transactionItem,
                    index !== transactions.length - 1 && {
                      borderBottomColor: colors.border,
                      borderBottomWidth: 1,
                    },
                  ]}
                >
                  <View style={styles.transactionMain}>
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor: isDark
                            ? income
                              ? "#143D35"
                              : "#492923"
                            : income
                              ? "#E4F6F0"
                              : "#FCECE7",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={
                          income
                            ? "arrow-bottom-left"
                            : "arrow-top-right"
                        }
                        size={23}
                        color={accent}
                      />
                    </View>

                    <View style={styles.transactionDetails}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.categoryName,
                          { color: colors.text },
                        ]}
                      >
                        {transaction.category_name || "Uncategorized"}
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.description,
                          { color: colors.secondaryText },
                        ]}
                      >
                        {transaction.description || "No description"}
                      </Text>

                      <View style={styles.dateLine}>
                        <MaterialCommunityIcons
                          name="calendar-month-outline"
                          size={13}
                          color={colors.secondaryText}
                        />
                        <Text
                          style={[
                            styles.transactionDate,
                            { color: colors.secondaryText },
                          ]}
                        >
                          {formatDate(transaction.transaction_date)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.amountContainer}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.amount,
                          { color: accent },
                        ]}
                      >
                        {income ? "+" : "-"} KSh{" "}
                        {formatAmount(transaction.amount)}
                      </Text>

                      <View
                        style={[
                          styles.typeBadge,
                          {
                            backgroundColor: isDark
                              ? income
                                ? "#143D35"
                                : "#492923"
                              : income
                                ? "#E4F6F0"
                                : "#FCECE7",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeBadgeText,
                            { color: accent },
                          ]}
                        >
                          {transaction.type || "Transaction"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actionsContainer}>
                    <Pressable
                      style={[
                        styles.actionButton,
                        { backgroundColor: PALE_NAVY },
                      ]}
                      onPress={() => handleEdit(transaction)}
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={16}
                        color={GREEN}
                      />
                      <Text
                        style={[
                          styles.editText,
                          { color: GREEN },
                        ]}
                      >
                        Edit
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: isDark
                            ? "#492923"
                            : "#FCECE7",
                        },
                      ]}
                      onPress={() => handleDelete(transaction)}
                    >
                      <MaterialCommunityIcons
                        name="delete-outline"
                        size={16}
                        color={expenseColor}
                      />
                      <Text
                        style={[
                          styles.deleteText,
                          { color: expenseColor },
                        ]}
                      >
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.bottomSpace} />
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 35,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
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
    marginLeft: 12,
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  headerAddButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  // Summary
  summaryCard: {
    borderRadius: 23,
    padding: 21,
    marginBottom: 17,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    color: "#DCE7FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  summaryNumber: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    marginTop: 5,
  },
  summaryCaption: {
    color: "#DCE7FF",
    fontSize: 12,
    marginTop: 1,
  },
  summaryIcon: {
    width: 57,
    height: 57,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.20)",
    marginVertical: 17,
  },
  summaryBottom: {
    flexDirection: "row",
  },
  summaryAmountBlock: {
    flex: 1,
  },
  summaryAmountHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  summaryAmountLabel: {
    color: "#DCE7FF",
    fontSize: 11,
    marginLeft: 5,
    fontWeight: "600",
  },
  summaryIncome: {
    color: "#B9F5D8",
    fontSize: 14,
    fontWeight: "800",
  },
  summaryExpense: {
    color: "#FFD1C5",
    fontSize: 14,
    fontWeight: "800",
  },

  // Search
  searchCard: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
    gap: 9,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 13,
  },
  searchButton: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // Filter toggle
  filterToggle: {
    minHeight: 65,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  filterToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterIconBox: {
    width: 39,
    height: 39,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  filterSubtitle: {
    fontSize: 10,
    marginTop: 3,
  },
  filterCount: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    paddingHorizontal: 5,
  },
  filterCountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  // Filter panel
  filterCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 17,
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 5,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 15,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    flex: 1,
    height: 41,
    borderRadius: 11,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  inputWrapper: {
    minHeight: 46,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterInput: {
    flex: 1,
    height: 44,
    fontSize: 13,
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateInputBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    marginBottom: 6,
    fontWeight: "600",
  },
  dateInput: {
    flex: 1,
    height: 44,
    fontSize: 11,
    minWidth: 0,
  },
  dateHint: {
    fontSize: 10,
    marginTop: 7,
  },
  filterActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 18,
  },
  applyButton: {
    flex: 1.3,
    height: 45,
    borderRadius: 11,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  clearButton: {
    flex: 1,
    height: 45,
    borderRadius: 11,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Add transaction
  addButton: {
    height: 53,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    marginTop: 3,
    marginBottom: 25,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
  },

  // List heading
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  listSubtitle: {
    fontSize: 11,
    marginTop: 4,
  },
  listCount: {
    minWidth: 33,
    height: 33,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  listCountText: {
    fontSize: 12,
    fontWeight: "800",
  },

  // Empty state
  emptyCard: {
    borderRadius: 19,
    padding: 27,
    alignItems: "center",
    borderWidth: 1,
  },
  emptyIconBox: {
    width: 69,
    height: 69,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 19,
  },
  emptyButton: {
    paddingHorizontal: 21,
    paddingVertical: 12,
    borderRadius: 11,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  // Transaction list
  transactionCard: {
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 7,
  },
  transactionItem: {
    paddingVertical: 16,
  },
  transactionMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  transactionDetails: {
    flex: 1,
    minWidth: 0,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "800",
  },
  description: {
    fontSize: 11,
    marginTop: 4,
  },
  dateLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  transactionDate: {
    fontSize: 10,
  },
  amountContainer: {
    alignItems: "flex-end",
    marginLeft: 7,
    maxWidth: "42%",
  },
  amount: {
    fontSize: 12,
    fontWeight: "800",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    marginTop: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },

  // Transaction actions
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    minWidth: 75,
    height: 33,
    borderRadius: 9,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
  },
  editText: {
    fontSize: 11,
    fontWeight: "800",
  },
  deleteText: {
    fontSize: 11,
    fontWeight: "800",
  },
  bottomSpace: {
    height: 20,
  },
});