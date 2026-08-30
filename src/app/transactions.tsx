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

import {
  router,
  useFocusEffect,
} from "expo-router";

import { useAuth } from "@/context/AuthContext";

import { useTheme } from "@/context/ThemeContext";

import {
  getTransactions,
  deleteTransaction,
  Transaction,
} from "@/services/transactionService";


// =====================================================
// TRANSACTIONS SCREEN
// =====================================================

export default function TransactionsScreen() {

  // ===================================================
  // AUTH
  // ===================================================

  const { token } = useAuth();


  // ===================================================
  // THEME
  // ===================================================

  const { colors, isDarkMode: isDark } = useTheme();


  // ===================================================
  // TRANSACTIONS
  // ===================================================

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);


  // ===================================================
  // LOADING
  // ===================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);


  // ===================================================
  // SEARCH
  // ===================================================

  const [searchText, setSearchText] =
    useState("");


  // ===================================================
  // FILTERS
  // ===================================================

  const [selectedType, setSelectedType] =
    useState<"All" | "Income" | "Expense">(
      "All"
    );

  const [categoryFilter, setCategoryFilter] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [showFilters, setShowFilters] =
    useState(false);


  // =====================================================
  // LOAD TRANSACTIONS
  // =====================================================

  const loadTransactions = async () => {

    if (!token) {

      setLoading(false);

      return;
    }

    try {

      setLoading(true);

      const response =
        await getTransactions(token);

      if (response.success) {

        setTransactions(
          response.transactions || []
        );

      } else {

        setTransactions([]);

      }

    } catch (error) {

      console.error(
        "Transaction history error:",
        error
      );

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


  // =====================================================
  // SEARCH AND FILTER
  // =====================================================

  const applySearchAndFilters =
    async () => {
      if (!token) {
        return;
      }

      try {
        setLoading(true);

        // Load the user's transactions and apply the filters locally.
        // This guarantees that category filtering works correctly even
        // when the backend search endpoint does not join category data.
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

            // Search matches both description and category.
            const matchesSearch =
              !search ||
              description.includes(search) ||
              transactionCategory.includes(search);

            // Category filter specifically checks category_name.
            const matchesCategory =
              !category ||
              transactionCategory.includes(category);

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
        console.error(
          "Search/filter error:",
          error
        );

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


  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = async () => {

    setSearchText("");

    setSelectedType("All");

    setCategoryFilter("");

    setStartDate("");

    setEndDate("");


    if (!token) {
      return;
    }


    try {

      setLoading(true);

      const response =
        await getTransactions(token);


      if (response.success) {

        setTransactions(
          response.transactions || []
        );

      }

    } catch (error) {

      console.error(
        "Clear filters error:",
        error
      );

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


  // =====================================================
  // REFRESH
  // =====================================================

  const refreshTransactions =
    async () => {

      if (!token) {
        return;
      }

      try {

        setRefreshing(true);

        const response =
          await getTransactions(token);


        if (response.success) {

          setTransactions(
            response.transactions || []
          );

        }

      } catch (error) {

        console.error(
          "Refresh error:",
          error
        );

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


  // =====================================================
  // LOAD WHEN SCREEN OPENS
  // =====================================================

  useFocusEffect(
    useCallback(() => {

      loadTransactions();

    }, [token])
  );


  // =====================================================
  // DELETE TRANSACTION (FIXED FOR WEB)
  // =====================================================

  const handleDelete =
    async (transaction: Transaction) => {

      if (!token) {
        return;
      }

      // WEB FIX: Use browser's native confirm() directly.
      if (typeof window !== 'undefined') {
        const isConfirmed = window.confirm(
          `Are you sure you want to delete this ${transaction.type?.toLowerCase() || ""} transaction?`
        );

        if (isConfirmed) {
          try {
            setLoading(true);
            const response = await deleteTransaction(token, transaction.id);

            if (response.success) {
              await loadTransactions();
              window.alert("Transaction deleted successfully.");
            } else {
              window.alert(response.message || "Unable to delete transaction.");
            }
          } catch (error) {
            console.error("Delete transaction error:", error);
            window.alert(error instanceof Error ? error.message : "Unable to delete transaction.");
          } finally {
            setLoading(false);
          }
        }
        return;
      }

      // NATIVE (Phone) FIX: Use Alert.
      Alert.alert(
        "Delete Transaction",

        `Are you sure you want to delete this ${transaction.type?.toLowerCase() || ""} transaction?`,

        [
          {
            text: "Cancel",
            style: "cancel",
          },

          {
            text: "Delete",
            style: "destructive",

            onPress: async () => {

              try {

                setLoading(true);

                const response =
                  await deleteTransaction(
                    token,
                    transaction.id
                  );


                if (response.success) {

                  Alert.alert(
                    "Success",
                    "Transaction deleted successfully."
                  );

                  await loadTransactions();

                } else {

                  Alert.alert(
                    "Error",
                    response.message ||
                      "Unable to delete transaction."
                  );

                }

              } catch (error) {

                console.error(
                  "Delete transaction error:",
                  error
                );

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


  // =====================================================
  // EDIT TRANSACTION
  // =====================================================

  const handleEdit =
    (transaction: Transaction) => {

      router.push({
        pathname: "/edit-transaction",

        params: {
          id: transaction.id.toString(),
        },

      });

    };


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate =
    (date: string) => {

      if (!date) {
        return "";
      }

      const transactionDate =
        new Date(date);


      if (
        Number.isNaN(
          transactionDate.getTime()
        )
      ) {

        return date;

      }


      return transactionDate.toLocaleDateString(
        "en-KE",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );

    };


  // =====================================================
  // FORMAT AMOUNT
  // =====================================================

  const formatAmount =
    (amount: number) => {

      return Number(
        amount || 0
      ).toLocaleString("en-KE");

    };


  // =====================================================
  // TYPE CHECK
  // =====================================================

  const isIncome =
    (transaction: Transaction) => {

      return transaction.type === "Income";

    };


  // =====================================================
  // CALCULATE TOTALS
  // =====================================================

  const totalIncome =
    transactions.reduce(
      (total, transaction) => {

        if (
          transaction.type === "Income"
        ) {

          return (
            total +
            Number(
              transaction.amount || 0
            )
          );

        }

        return total;

      },
      0
    );


  const totalExpense =
    transactions.reduce(
      (total, transaction) => {

        if (
          transaction.type === "Expense"
        ) {

          return (
            total +
            Number(
              transaction.amount || 0
            )
          );

        }

        return total;

      },
      0
    );


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <SafeAreaView
        style={[
          styles.loadingContainer,
          {
            backgroundColor:
              colors.background,
          },
        ]}
      >

        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text
          style={[
            styles.loadingText,
            {
              color:
                colors.secondaryText,
            },
          ]}
        >
          Loading transactions...
        </Text>

      </SafeAreaView>

    );

  }


  // =====================================================
  // SCREEN
  // =====================================================

  return (

    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >

      <ScrollView

        contentContainerStyle={
          styles.scrollContent
        }

        showsVerticalScrollIndicator={
          false
        }

        keyboardShouldPersistTaps="handled"

        refreshControl={

          <RefreshControl

            refreshing={refreshing}

            onRefresh={
              refreshTransactions
            }

            tintColor={
              colors.primary
            }

          />

        }

      >


        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>

          <Pressable
            style={styles.backButtonContainer}
            onPress={() => router.back()}
          >

            <Text
              style={[
                styles.backButton,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              ‹
            </Text>

          </Pressable>


          <View
            style={styles.headerTitleContainer}
          >

            <Text
              style={[
                styles.title,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Transactions
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              Track your income and expenses
            </Text>

          </View>


          <View
            style={styles.headerSpace}
          />

        </View>


        {/* =================================================
            SUMMARY
        ================================================= */}

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor:
                colors.primary,
            },
          ]}
        >

          <View
            style={styles.summaryHeader}
          >

            <View>

              <Text
                style={styles.summaryLabel}
              >
                Transaction Overview
              </Text>

              <Text
                style={styles.summaryNumber}
              >
                {transactions.length}
              </Text>

              <Text
                style={styles.summarySmall}
              >
                transaction
                {transactions.length === 1
                  ? ""
                  : "s"} found
              </Text>

            </View>


            <View
              style={styles.summaryIcon}
            >

              <Text
                style={styles.summaryIconText}
              >
                ₵
              </Text>

            </View>

          </View>


          <View
            style={styles.summaryDivider}
          />


          <View
            style={styles.summaryTotals}
          >

            <View
              style={styles.summaryTotalItem}
            >

              <Text
                style={styles.summaryTotalLabel}
              >
                Income
              </Text>

              <Text
                style={styles.summaryIncome}
              >
                + KSh{" "}
                {formatAmount(
                  totalIncome
                )}
              </Text>

            </View>


            <View
              style={styles.summaryTotalItem}
            >

              <Text
                style={styles.summaryTotalLabel}
              >
                Expenses
              </Text>

              <Text
                style={styles.summaryExpense}
              >
                - KSh{" "}
                {formatAmount(
                  totalExpense
                )}
              </Text>

            </View>

          </View>

        </View>


        {/* =================================================
            SEARCH
        ================================================= */}

        <View
          style={[
            styles.searchCard,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >

          <View
            style={styles.searchRow}
          >

            <View
              style={[
                styles.searchInputContainer,
                {
                  backgroundColor:
                    colors.inputBackground,
                  borderColor:
                    colors.border,
                },
              ]}
            >

              <Text
                style={[
                  styles.searchIcon,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                ⌕
              </Text>


              <TextInput

                style={[
                  styles.searchInput,
                  {
                    color:
                      colors.text,
                  },
                ]}

                placeholder=
                  "Search transactions..."

                placeholderTextColor=
                  {colors.secondaryText}

                value={searchText}

                onChangeText={
                  setSearchText
                }

                returnKeyType="search"

                onSubmitEditing={
                  applySearchAndFilters
                }

              />

            </View>


            <Pressable
              style={[
                styles.searchButton,
                {
                  backgroundColor:
                    colors.primary,
                },
              ]}
              onPress={
                applySearchAndFilters
              }
            >

              <Text
                style={
                  styles.searchButtonText
                }
              >
                Search
              </Text>

            </Pressable>

          </View>

        </View>


        {/* =================================================
            FILTER TOGGLE
        ================================================= */}

        <Pressable

          style={[
            styles.filterToggle,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}

          onPress={() =>
            setShowFilters(
              !showFilters
            )
          }

        >

          <View
            style={styles.filterToggleLeft}
          >

            <View
              style={[
                styles.filterIconContainer,
                {
                  backgroundColor:
                    isDark
                      ? "#1E3A5F"
                      : "#EFF6FF",
                },
              ]}
            >

              <Text
                style={[
                  styles.filterIcon,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                ≡
              </Text>

            </View>


            <Text
              style={[
                styles.filterToggleText,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Filters
            </Text>

          </View>


          <Text
            style={[
              styles.filterArrow,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            {showFilters ? "▲" : "▼"}
          </Text>

        </Pressable>


        {/* =================================================
            FILTERS
        ================================================= */}

        {showFilters && (

          <View
            style={[
              styles.filterCard,
              {
                backgroundColor:
                  colors.card,
                borderColor:
                  colors.border,
              },
            ]}
          >

            <Text
              style={[
                styles.filterTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Filter Transactions
            </Text>


            {/* TYPE */}

            <Text
              style={[
                styles.filterLabel,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Transaction Type
            </Text>


            <View
              style={styles.typeRow}
            >

              {/* ALL */}

              <Pressable

                style={[
                  styles.typeButton,

                  {
                    backgroundColor:
                      selectedType === "All"
                        ? colors.primary
                        : colors.inputBackground,

                    borderColor:
                      selectedType === "All"
                        ? colors.primary
                        : colors.border,
                  },
                ]}

                onPress={() =>
                  setSelectedType("All")
                }

              >

                <Text
                  style={[
                    styles.typeButtonText,

                    {
                      color:
                        selectedType === "All"
                          ? "#FFFFFF"
                          : colors.secondaryText,
                    },
                  ]}
                >
                  All
                </Text>

              </Pressable>


              {/* INCOME */}

              <Pressable

                style={[
                  styles.typeButton,

                  {
                    backgroundColor:
                      selectedType === "Income"
                        ? "#16A34A"
                        : colors.inputBackground,

                    borderColor:
                      selectedType === "Income"
                        ? "#16A34A"
                        : colors.border,
                  },
                ]}

                onPress={() =>
                  setSelectedType("Income")
                }

              >

                <Text
                  style={[
                    styles.typeButtonText,

                    {
                      color:
                        selectedType === "Income"
                          ? "#FFFFFF"
                          : colors.secondaryText,
                    },
                  ]}
                >
                  Income
                </Text>

              </Pressable>


              {/* EXPENSE */}

              <Pressable

                style={[
                  styles.typeButton,

                  {
                    backgroundColor:
                      selectedType === "Expense"
                        ? "#DC2626"
                        : colors.inputBackground,

                    borderColor:
                      selectedType === "Expense"
                        ? "#DC2626"
                        : colors.border,
                  },
                ]}

                onPress={() =>
                  setSelectedType("Expense")
                }

              >

                <Text
                  style={[
                    styles.typeButtonText,

                    {
                      color:
                        selectedType === "Expense"
                          ? "#FFFFFF"
                          : colors.secondaryText,
                    },
                  ]}
                >
                  Expense
                </Text>

              </Pressable>

            </View>


            {/* CATEGORY */}

            <Text
              style={[
                styles.filterLabel,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Category
            </Text>


            <TextInput

              style={[
                styles.filterInput,
                {
                  backgroundColor:
                    colors.inputBackground,

                  borderColor:
                    colors.border,

                  color:
                    colors.text,
                },
              ]}

              placeholder="e.g. Food"

              placeholderTextColor=
                {colors.secondaryText}

              value={categoryFilter}

              onChangeText={
                setCategoryFilter
              }

            />


            {/* START DATE */}

            <Text
              style={[
                styles.filterLabel,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Start Date
            </Text>


            <TextInput

              style={[
                styles.filterInput,
                {
                  backgroundColor:
                    colors.inputBackground,

                  borderColor:
                    colors.border,

                  color:
                    colors.text,
                },
              ]}

              placeholder="YYYY-MM-DD"

              placeholderTextColor=
                {colors.secondaryText}

              value={startDate}

              onChangeText={
                setStartDate
              }

            />


            {/* END DATE */}

            <Text
              style={[
                styles.filterLabel,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              End Date
            </Text>


            <TextInput

              style={[
                styles.filterInput,
                {
                  backgroundColor:
                    colors.inputBackground,

                  borderColor:
                    colors.border,

                  color:
                    colors.text,
                },
              ]}

              placeholder="YYYY-MM-DD"

              placeholderTextColor=
                {colors.secondaryText}

              value={endDate}

              onChangeText={
                setEndDate
              }

            />


            {/* ACTIONS */}

            <View
              style={styles.filterActions}
            >

              <Pressable

                style={[
                  styles.applyButton,
                  {
                    backgroundColor:
                      colors.primary,
                  },
                ]}

                onPress={
                  applySearchAndFilters
                }

              >

                <Text
                  style={
                    styles.applyButtonText
                  }
                >
                  Apply Filters
                </Text>

              </Pressable>


              <Pressable

                style={[
                  styles.clearButton,
                  {
                    backgroundColor:
                      colors.inputBackground,

                    borderColor:
                      colors.border,
                  },
                ]}

                onPress={
                  clearFilters
                }

              >

                <Text
                  style={[
                    styles.clearButtonText,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  Clear
                </Text>

              </Pressable>

            </View>

          </View>

        )}


        {/* =================================================
            ADD TRANSACTION
        ================================================= */}

        <Pressable

          style={[
            styles.addButton,
            {
              backgroundColor:
                colors.primary,
            },
          ]}

          onPress={() =>
            router.push(
              "/add-transaction"
            )
          }

        >

          <Text
            style={styles.addButtonIcon}
          >
            +
          </Text>

          <Text
            style={styles.addButtonText}
          >
            Add Transaction
          </Text>

        </Pressable>


        {/* =================================================
            TRANSACTION LIST TITLE
        ================================================= */}

        {transactions.length > 0 && (

          <View
            style={styles.listHeader}
          >

            <Text
              style={[
                styles.listTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Recent Transactions
            </Text>

            <Text
              style={[
                styles.listCount,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              {transactions.length}
            </Text>

          </View>

        )}


        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {transactions.length === 0 ? (

          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor:
                  colors.card,
                borderColor:
                  colors.border,
              },
            ]}
          >

            <View
              style={[
                styles.emptyIconContainer,
                {
                  backgroundColor:
                    isDark
                      ? "#1E3A5F"
                      : "#EFF6FF",
                },
              ]}
            >

              <Text
                style={[
                  styles.emptyIcon,
                  {
                    color:
                      colors.primary,
                  },
                ]}
              >
                ₵
              </Text>

            </View>


            <Text
              style={[
                styles.emptyTitle,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              No Transactions Found
            </Text>


            <Text
              style={[
                styles.emptyText,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              No transactions match your
              current search or filter
              settings.
            </Text>


            <Pressable

              style={[
                styles.emptyButton,
                {
                  backgroundColor:
                    colors.primary,
                },
              ]}

              onPress={
                clearFilters
              }

            >

              <Text
                style={
                  styles.emptyButtonText
                }
              >
                Clear Filters
              </Text>

            </Pressable>

          </View>

        ) : (


          /* =================================================
             TRANSACTION LIST
          ================================================= */

          <View
            style={[
              styles.transactionCard,
              {
                backgroundColor:
                  colors.card,
                borderColor:
                  colors.border,
              },
            ]}
          >

            {transactions.map(
              (transaction, index) => {

                const income =
                  isIncome(transaction);


                return (

                  <View

                    key={
                      transaction.id
                    }

                    style={[
                      styles.transaction,

                      index ===
                        transactions.length - 1 &&
                        styles.lastTransaction,

                      {
                        borderBottomColor:
                          colors.border,
                      },
                    ]}

                  >


                    {/* MAIN TRANSACTION */}

                    <View
                      style={
                        styles.transactionMain
                      }
                    >


                      {/* ICON */}

                      <View
                        style={[
                          styles.iconContainer,

                          income
                            ? styles.incomeIcon
                            : styles.expenseIcon,

                          isDark &&
                            (
                              income
                                ? styles.darkIncomeIcon
                                : styles.darkExpenseIcon
                            ),
                        ]}
                      >

                        <Text
                          style={[
                            styles.iconText,

                            {
                              color:
                                income
                                  ? "#16A34A"
                                  : "#DC2626",
                            },
                          ]}
                        >
                          {income
                            ? "+"
                            : "−"}
                        </Text>

                      </View>


                      {/* DETAILS */}

                      <View
                        style={
                          styles.transactionDetails
                        }
                      >

                        <Text
                          numberOfLines={1}
                          style={[
                            styles.categoryName,
                            {
                              color:
                                colors.text,
                            },
                          ]}
                        >
                          {
                            transaction.category_name ||
                            "Uncategorized"
                          }
                        </Text>


                        <Text
                          numberOfLines={1}
                          style={[
                            styles.description,
                            {
                              color:
                                colors.secondaryText,
                            },
                          ]}
                        >
                          {
                            transaction.description ||
                            "No description"
                          }
                        </Text>


                        <Text
                          style={[
                            styles.date,
                            {
                              color:
                                colors.secondaryText,
                            },
                          ]}
                        >
                          {formatDate(
                            transaction.transaction_date
                          )}
                        </Text>

                      </View>


                      {/* AMOUNT */}

                      <View
                        style={
                          styles.amountContainer
                        }
                      >

                        <Text
                          style={[
                            styles.amount,

                            income
                              ? styles.incomeAmount
                              : styles.expenseAmount,
                          ]}
                        >
                          {income
                            ? "+"
                            : "-"}{" "}
                          KSh{" "}
                          {formatAmount(
                            transaction.amount
                          )}
                        </Text>


                        <View
                          style={[
                            styles.typeBadge,

                            income
                              ? styles.incomeBadge
                              : styles.expenseBadge,

                            isDark &&
                              (
                                income
                                  ? styles.darkIncomeBadge
                                  : styles.darkExpenseBadge
                              ),
                          ]}
                        >

                          <Text
                            style={[
                              styles.typeText,

                              income
                                ? styles.incomeType
                                : styles.expenseType,
                            ]}
                          >
                            {
                              transaction.type ||
                              "Transaction"
                            }
                          </Text>

                        </View>

                      </View>

                    </View>


                    {/* ACTIONS */}

                    <View
                      style={
                        styles.actionsContainer
                      }
                    >

                      <Pressable

                        style={[
                          styles.editButton,

                          {
                            backgroundColor:
                              isDark
                                ? "#172554"
                                : "#EFF6FF",
                          },
                        ]}

                        onPress={() =>
                          handleEdit(
                            transaction
                          )
                        }

                      >

                        <Text
                          style={[
                            styles.editText,
                            {
                              color:
                                colors.primary,
                            },
                          ]}
                        >
                          Edit
                        </Text>

                      </Pressable>


                      <Pressable

                        style={[
                          styles.deleteButton,

                          {
                            backgroundColor:
                              isDark
                                ? "#3B1515"
                                : "#FEF2F2",
                          },
                        ]}

                        onPress={() =>
                          handleDelete(
                            transaction
                          )
                        }

                      >

                        <Text
                          style={
                            styles.deleteText
                          }
                        >
                          Delete
                        </Text>

                      </Pressable>

                    </View>

                  </View>

                );

              }
            )}

          </View>

        )}


        <View
          style={styles.bottomSpace}
        />

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
    fontSize: 15,
  },


  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 44,
  },


  // ===================================================
  // HEADER
  // ===================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },


  backButtonContainer: {
    width: 42,
    height: 42,
    justifyContent: "center",
  },


  backButton: {
    fontSize: 40,
    lineHeight: 40,
    fontWeight: "300",
  },


  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },


  title: {
    fontSize: 23,
    fontWeight: "800",
  },


  subtitle: {
    fontSize: 12,
    marginTop: 3,
  },


  headerSpace: {
    width: 42,
  },


  // ===================================================
  // SUMMARY
  // ===================================================

  summaryCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },


  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },


  summaryLabel: {
    color: "#DCE7FF",
    fontSize: 13,
    fontWeight: "600",
  },


  summaryNumber: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 3,
  },


  summarySmall: {
    color: "#DCE7FF",
    fontSize: 12,
    marginTop: 2,
  },


  summaryIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor:
      "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },


  summaryIconText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
  },


  summaryDivider: {
    height: 1,
    backgroundColor:
      "rgba(255,255,255,0.18)",
    marginVertical: 17,
  },


  summaryTotals: {
    flexDirection: "row",
    justifyContent: "space-between",
  },


  summaryTotalItem: {
    flex: 1,
  },


  summaryTotalLabel: {
    color: "#DCE7FF",
    fontSize: 11,
    marginBottom: 4,
  },


  summaryIncome: {
    color: "#BBF7D0",
    fontSize: 14,
    fontWeight: "800",
  },


  summaryExpense: {
    color: "#FECACA",
    fontSize: 14,
    fontWeight: "800",
  },


  // ===================================================
  // SEARCH
  // ===================================================

  searchCard: {
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },


  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },


  searchInputContainer: {
    flex: 1,
    height: 48,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginRight: 8,
  },


  searchIcon: {
    fontSize: 23,
    marginRight: 7,
  },


  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
  },


  searchButton: {
    height: 48,
    paddingHorizontal: 15,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },


  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },


  // ===================================================
  // FILTER TOGGLE
  // ===================================================

  filterToggle: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },


  filterToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
  },


  filterIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },


  filterIcon: {
    fontSize: 18,
    fontWeight: "800",
  },


  filterToggleText: {
    fontSize: 14,
    fontWeight: "700",
  },


  filterArrow: {
    fontSize: 12,
    fontWeight: "800",
  },


  // ===================================================
  // FILTER CARD
  // ===================================================

  filterCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },


  filterTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 5,
  },


  filterLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 13,
    marginBottom: 7,
  },


  filterInput: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },


  filterHint: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },

  typeRow: {
    flexDirection: "row",
    gap: 8,
  },


  typeButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },


  typeButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },


  filterActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 19,
  },


  applyButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },


  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },


  clearButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },


  clearButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },


  // ===================================================
  // ADD BUTTON
  // ===================================================

  addButton: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 24,
  },


  addButtonIcon: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "400",
    marginRight: 7,
  },


  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },


  // ===================================================
  // LIST HEADER
  // ===================================================

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },


  listTitle: {
    fontSize: 19,
    fontWeight: "800",
  },


  listCount: {
    fontSize: 13,
    fontWeight: "600",
  },


  // ===================================================
  // EMPTY
  // ===================================================

  emptyCard: {
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
  },


  emptyIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },


  emptyIcon: {
    fontSize: 30,
    fontWeight: "800",
  },


  emptyTitle: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 8,
  },


  emptyText: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },


  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },


  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },


  // ===================================================
  // TRANSACTION CARD
  // ===================================================

  transactionCard: {
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },


  transaction: {
    paddingVertical: 17,
    borderBottomWidth: 1,
  },


  lastTransaction: {
    borderBottomWidth: 0,
  },


  transactionMain: {
    flexDirection: "row",
    alignItems: "center",
  },


  // ===================================================
  // ICON
  // ===================================================

  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },


  incomeIcon: {
    backgroundColor: "#DCFCE7",
  },


  expenseIcon: {
    backgroundColor: "#FEE2E2",
  },


  darkIncomeIcon: {
    backgroundColor: "#143D2A",
  },


  darkExpenseIcon: {
    backgroundColor: "#431B1B",
  },


  iconText: {
    fontSize: 23,
    fontWeight: "800",
  },


  // ===================================================
  // DETAILS
  // ===================================================

  transactionDetails: {
    flex: 1,
    minWidth: 0,
  },


  categoryName: {
    fontSize: 15,
    fontWeight: "800",
  },


  description: {
    fontSize: 12,
    marginTop: 3,
  },


  date: {
    fontSize: 11,
    marginTop: 5,
  },


  // ===================================================
  // AMOUNT
  // ===================================================

  amountContainer: {
    alignItems: "flex-end",
    marginLeft: 8,
  },


  amount: {
    fontSize: 13,
    fontWeight: "800",
  },


  incomeAmount: {
    color: "#16A34A",
  },


  expenseAmount: {
    color: "#DC2626",
  },


  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 5,
  },


  incomeBadge: {
    backgroundColor: "#DCFCE7",
  },


  expenseBadge: {
    backgroundColor: "#FEE2E2",
  },


  darkIncomeBadge: {
    backgroundColor: "#143D2A",
  },


  darkExpenseBadge: {
    backgroundColor: "#431B1B",
  },


  typeText: {
    fontSize: 9,
    fontWeight: "800",
  },


  incomeType: {
    color: "#16A34A",
  },


  expenseType: {
    color: "#DC2626",
  },


  // ===================================================
  // ACTIONS
  // ===================================================

  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 13,
    paddingLeft: 56,
  },


  editButton: {
    minWidth: 70,
    height: 36,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },


  editText: {
    fontSize: 12,
    fontWeight: "800",
  },


  deleteButton: {
    minWidth: 70,
    height: 36,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },


  deleteText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "800",
  },


  bottomSpace: {
    height: 20,
  },

});