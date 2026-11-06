import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  router,
  useFocusEffect,
} from "expo-router";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "@/context/AuthContext";

import { useTheme } from "@/context/ThemeContext";

import {
  getTransactions,
  Transaction,
} from "@/services/transactionService";

import {
  getBudgets,
  Budget,
} from "@/services/budgetService";


// =====================================================
// TYPES
// =====================================================

type ReportPeriod =
  | "This Month"
  | "Last Month"
  | "This Year"
  | "All Time";

type MonthlyReport = {
  key: string;
  month: string;
  fullMonth: string;
  income: number;
  expense: number;
};


// =====================================================
// CONSTANTS
// =====================================================

const GREEN = "#16A085";
const RED = "#E76F51";
const PURPLE = "#8064D9";
const BLUE = "#4361EE";
const AMBER = "#E6A23C";


// =====================================================
// REPORT SCREEN
// =====================================================

export default function ReportsScreen() {

  const { token } = useAuth();

  const {
    isDarkMode,
    colors,
  } = useTheme();


  // ===================================================
  // STATE
  // ===================================================

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [budgets, setBudgets] =
    useState<Budget[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [period, setPeriod] =
    useState<ReportPeriod>("This Month");


  // ===================================================
  // THEME COLORS
  // ===================================================

  const mutedBackground = isDarkMode
    ? "#26364A"
    : "#F1F5F9";

  const subtleBorder = isDarkMode
    ? "#34465C"
    : "#E8EDF3";

  const mutedText = colors.secondaryText;


  // ===================================================
  // LOAD REPORT DATA
  // ===================================================

  const loadReports = async () => {

    if (!token) {
      setLoading(false);
      return;
    }

    try {

      setLoading(true);

      const [
        transactionResponse,
        budgetResponse,
      ] = await Promise.all([
        getTransactions(token),
        getBudgets(token),
      ]);

      if (transactionResponse.success) {
        setTransactions(
          transactionResponse.transactions || []
        );
      } else {
        setTransactions([]);
      }

      if (budgetResponse.success) {
        setBudgets(
          budgetResponse.budgets || []
        );
      } else {
        setBudgets([]);
      }

    } catch (error) {

      console.error(
        "Reports loading error:",
        error
      );

      setTransactions([]);
      setBudgets([]);

    } finally {

      setLoading(false);

    }

  };


  // ===================================================
  // LOAD WHEN SCREEN OPENS
  // ===================================================

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [token])
  );


  // ===================================================
  // REFRESH REPORTS
  // ===================================================

  const refreshReports = async () => {

    if (!token) return;

    try {

      setRefreshing(true);

      const [
        transactionResponse,
        budgetResponse,
      ] = await Promise.all([
        getTransactions(token),
        getBudgets(token),
      ]);

      if (transactionResponse.success) {
        setTransactions(
          transactionResponse.transactions || []
        );
      }

      if (budgetResponse.success) {
        setBudgets(
          budgetResponse.budgets || []
        );
      }

    } catch (error) {

      console.error(
        "Reports refresh error:",
        error
      );

    } finally {

      setRefreshing(false);

    }

  };


  // ===================================================
  // CURRENT DATE
  // ===================================================

  const now = new Date();

  const currentMonth = now.getMonth() + 1;

  const currentYear = now.getFullYear();


  // ===================================================
  // LAST MONTH
  // ===================================================

  const lastMonthDate = new Date(
    currentYear,
    currentMonth - 2,
    1
  );

  const lastMonth = lastMonthDate.getMonth() + 1;

  const lastMonthYear = lastMonthDate.getFullYear();


  // ===================================================
  // FILTER TRANSACTIONS
  // ===================================================

  const filteredTransactions = useMemo(() => {

    return transactions.filter((transaction) => {

      if (period === "All Time") {
        return true;
      }

      if (!transaction.transaction_date) {
        return false;
      }

      const date = new Date(
        transaction.transaction_date
      );

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      if (period === "This Month") {
        return (
          month === currentMonth &&
          year === currentYear
        );
      }

      if (period === "Last Month") {
        return (
          month === lastMonth &&
          year === lastMonthYear
        );
      }

      if (period === "This Year") {
        return year === currentYear;
      }

      return true;

    });

  }, [
    transactions,
    period,
    currentMonth,
    currentYear,
    lastMonth,
    lastMonthYear,
  ]);


  // ===================================================
  // TOTAL INCOME
  // ===================================================

  const totalIncome = useMemo(() => {

    return filteredTransactions.reduce(
      (total, transaction) => {

        if (transaction.type !== "Income") {
          return total;
        }

        return total + Number(
          transaction.amount || 0
        );

      },
      0
    );

  }, [filteredTransactions]);


  // ===================================================
  // TOTAL EXPENSE
  // ===================================================

  const totalExpense = useMemo(() => {

    return filteredTransactions.reduce(
      (total, transaction) => {

        if (transaction.type !== "Expense") {
          return total;
        }

        return total + Number(
          transaction.amount || 0
        );

      },
      0
    );

  }, [filteredTransactions]);


  // ===================================================
  // BALANCE AND COUNTS
  // ===================================================

  const balance = totalIncome - totalExpense;

  const transactionCount =
    filteredTransactions.length;

  const incomeCount =
    filteredTransactions.filter(
      item => item.type === "Income"
    ).length;

  const expenseCount =
    filteredTransactions.filter(
      item => item.type === "Expense"
    ).length;

  const averageExpense =
    expenseCount > 0
      ? totalExpense / expenseCount
      : 0;


  // ===================================================
  // CURRENCY FORMAT
  // ===================================================

  const formatCurrency = (amount: number) => {

    return Number(
      amount || 0
    ).toLocaleString("en-KE", {
      maximumFractionDigits: 2,
    });

  };


  // ===================================================
  // CATEGORY BREAKDOWN
  // ===================================================

  const getCategoryBreakdown = (
    type: "Income" | "Expense"
  ) => {

    const categoryMap: Record<string, number> = {};

    filteredTransactions.forEach((transaction) => {

      if (transaction.type !== type) {
        return;
      }

      const category =
        transaction.category_name ||
        "Uncategorized";

      const amount = Number(
        transaction.amount || 0
      );

      categoryMap[category] =
        (categoryMap[category] || 0) + amount;

    });

    return Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

  };


  const expenseByCategory = useMemo(
    () => getCategoryBreakdown("Expense"),
    [filteredTransactions]
  );

  const incomeByCategory = useMemo(
    () => getCategoryBreakdown("Income"),
    [filteredTransactions]
  );


  // ===================================================
  // HIGHEST EXPENSE CATEGORY
  // ===================================================

  const highestExpenseCategory =
    expenseByCategory.length > 0
      ? expenseByCategory[0]
      : null;


  // ===================================================
  // CURRENT MONTH BUDGET
  // ===================================================

  const currentBudget = budgets.find((budget) => {

    return (
      Number(budget.month) === currentMonth &&
      Number(budget.year) === currentYear
    );

  });

  const budgetAmount = currentBudget
    ? Number(currentBudget.budget_amount) || 0
    : 0;


  // ===================================================
  // BUDGET PERCENTAGE
  // ===================================================

  const budgetPercentage = budgetAmount > 0
    ? (totalExpense / budgetAmount) * 100
    : 0;

  const safeBudgetPercentage = Math.min(
    Math.max(budgetPercentage, 0),
    100
  );

  const budgetDifference =
    budgetAmount - totalExpense;


  // ===================================================
  // SIX MONTH REPORT
  // ===================================================

  const sixMonthData = useMemo<MonthlyReport[]>(() => {

    const result: MonthlyReport[] = [];

    for (let i = 5; i >= 0; i--) {

      const date = new Date(
        currentYear,
        currentMonth - 1 - i,
        1
      );

      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const monthName = date.toLocaleString(
        "en-US",
        { month: "short" }
      );

      const fullMonth = date.toLocaleString(
        "en-US",
        {
          month: "long",
          year: "numeric",
        }
      );

      let income = 0;
      let expense = 0;

      transactions.forEach((transaction) => {

        if (!transaction.transaction_date) {
          return;
        }

        const transactionDate = new Date(
          transaction.transaction_date
        );

        if (
          Number.isNaN(transactionDate.getTime())
        ) {
          return;
        }

        const transactionMonth =
          transactionDate.getMonth() + 1;

        const transactionYear =
          transactionDate.getFullYear();

        if (
          transactionMonth !== month ||
          transactionYear !== year
        ) {
          return;
        }

        const amount = Number(
          transaction.amount || 0
        );

        if (transaction.type === "Income") {
          income += amount;
        }

        if (transaction.type === "Expense") {
          expense += amount;
        }

      });

      result.push({
        key: `${year}-${month}`,
        month: monthName,
        fullMonth,
        income,
        expense,
      });

    }

    return result;

  }, [
    transactions,
    currentMonth,
    currentYear,
  ]);


  // ===================================================
  // SIX MONTH MAX VALUE
  // ===================================================

  const sixMonthMax = useMemo(() => {

    let max = 0;

    sixMonthData.forEach((item) => {

      max = Math.max(
        max,
        item.income,
        item.expense
      );

    });

    return max;

  }, [sixMonthData]);


  // ===================================================
  // COMPARISON BAR MAX
  // ===================================================

  const comparisonMax = Math.max(
    totalIncome,
    totalExpense,
    1
  );


  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (loading) {

    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          {
            backgroundColor: colors.background,
          },
        ]}
      >

        <ActivityIndicator
          size="large"
          color={GREEN}
        />

        <Text
          style={[
            styles.loadingText,
            { color: colors.secondaryText },
          ]}
        >
          Preparing your financial reports...
        </Text>

      </SafeAreaView>
    );

  }


  // ===================================================
  // REUSABLE SECTION TITLE
  // ===================================================

  const SectionTitle = ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: string;
  }) => (

    <View style={styles.sectionHeading}>

      <Text
        style={[
          styles.sectionTitle,
          { color: colors.text },
        ]}
      >
        {title}
      </Text>

      {subtitle && (
        <Text
          style={[
            styles.sectionSubtitle,
            { color: mutedText },
          ]}
        >
          {subtitle}
        </Text>
      )}

    </View>

  );


  // ===================================================
  // REUSABLE EMPTY STATE
  // ===================================================

  const EmptyState = ({
    message,
  }: {
    message: string;
  }) => (

    <View style={styles.emptyContainer}>

      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: mutedBackground },
        ]}
      >
        <MaterialCommunityIcons
          name="chart-box-outline"
          size={30}
          color={mutedText}
        />
      </View>

      <Text
        style={[
          styles.emptyText,
          { color: mutedText },
        ]}
      >
        {message}
      </Text>

    </View>

  );


  // ===================================================
  // CATEGORY REPORT COMPONENT
  // ===================================================

  const CategoryReport = ({
    items,
    total,
    type,
  }: {
    items: {
      category: string;
      amount: number;
    }[];
    total: number;
    type: "Income" | "Expense";
  }) => {

    const mainColor =
      type === "Income" ? GREEN : RED;

    const categoryIcon =
      type === "Income"
        ? "cash-plus"
        : "shopping-outline";

    if (items.length === 0) {

      return (
        <EmptyState
          message={`No ${type.toLowerCase()} transactions found for this period.`}
        />
      );

    }

    return (

      <View>

        {items.map((item, index) => {

          const percentage = total > 0
            ? (item.amount / total) * 100
            : 0;

          return (

            <View
              key={item.category}
              style={styles.categoryItem}
            >

              <View style={styles.categoryTopRow}>

                <View style={styles.categoryLeft}>

                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor:
                          type === "Income"
                            ? isDarkMode
                              ? "#173E39"
                              : "#E6F6F1"
                            : isDarkMode
                              ? "#49312E"
                              : "#FCEDE9",
                      },
                    ]}
                  >

                    <MaterialCommunityIcons
                      name={categoryIcon}
                      size={19}
                      color={mainColor}
                    />

                  </View>

                  <View style={styles.categoryNameContainer}>

                    <Text
                      style={[
                        styles.categoryName,
                        { color: colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {item.category}
                    </Text>

                    <Text
                      style={[
                        styles.categoryPercentage,
                        { color: mutedText },
                      ]}
                    >
                      {percentage.toFixed(1)}% of total
                    </Text>

                  </View>

                </View>

                <Text
                  style={[
                    styles.categoryAmount,
                    { color: mainColor },
                  ]}
                >
                  KSh {formatCurrency(item.amount)}
                </Text>

              </View>

              <View
                style={[
                  styles.categoryTrack,
                  { backgroundColor: mutedBackground },
                ]}
              >

                <View
                  style={[
                    styles.categoryProgress,
                    {
                      width: `${percentage}%`,
                      backgroundColor: mainColor,
                    },
                  ]}
                />

              </View>

            </View>

          );

        })}

      </View>

    );

  };


  // ===================================================
  // SCREEN
  // ===================================================

  return (

    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshReports}
            tintColor={GREEN}
          />
        }
      >

        {/* =============================================
            HEADER
        ============================================= */}

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
              name="chevron-left"
              size={29}
              color={colors.text}
            />

          </Pressable>

          <View style={styles.headerTitleContainer}>

            <Text
              style={[
                styles.headerTitle,
                { color: colors.text },
              ]}
            >
              Financial Reports
            </Text>

            <Text
              style={[
                styles.headerSubtitle,
                { color: mutedText },
              ]}
            >
              Understand your money better
            </Text>

          </View>

          <View
            style={[
              styles.headerIcon,
              { backgroundColor: isDarkMode ? "#173E39" : "#E6F6F1" },
            ]}
          >

            <MaterialCommunityIcons
              name="chart-box-outline"
              size={24}
              color={GREEN}
            />

          </View>

        </View>


        {/* =============================================
            REPORT PERIOD
        ============================================= */}

        <View
          style={[
            styles.periodCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >

          <View style={styles.periodHeading}>

            <MaterialCommunityIcons
              name="calendar-range"
              size={20}
              color={GREEN}
            />

            <Text
              style={[
                styles.periodTitle,
                { color: colors.text },
              ]}
            >
              Report Period
            </Text>

          </View>

          <View style={styles.periodRow}>

            {(
              [
                "This Month",
                "Last Month",
                "This Year",
                "All Time",
              ] as ReportPeriod[]
            ).map((item) => {

              const selected = period === item;

              return (

                <Pressable
                  key={item}
                  style={[
                    styles.periodButton,
                    {
                      backgroundColor: selected
                        ? GREEN
                        : mutedBackground,
                    },
                  ]}
                  onPress={() => setPeriod(item)}
                >

                  <Text
                    style={[
                      styles.periodButtonText,
                      {
                        color: selected
                          ? "#FFFFFF"
                          : mutedText,
                      },
                    ]}
                  >
                    {item}
                  </Text>

                </Pressable>

              );

            })}

          </View>

        </View>


        {/* =============================================
            FINANCIAL SUMMARY
        ============================================= */}

        <SectionTitle
          title="Financial Summary"
          subtitle={`Your performance for ${period.toLowerCase()}`}
        />

        <View style={styles.summaryGrid}>

          {/* INCOME */}

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >

            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: isDarkMode ? "#173E39" : "#E6F6F1" },
              ]}
            >
              <MaterialCommunityIcons
                name="trending-up"
                size={22}
                color={GREEN}
              />
            </View>

            <Text style={[styles.summaryLabel, { color: mutedText }]}>
              Total Income
            </Text>

            <Text style={[styles.summaryAmount, { color: GREEN }]}>
              KSh {formatCurrency(totalIncome)}
            </Text>

          </View>


          {/* EXPENSES */}

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >

            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: isDarkMode ? "#49312E" : "#FCEDE9" },
              ]}
            >
              <MaterialCommunityIcons
                name="trending-down"
                size={22}
                color={RED}
              />
            </View>

            <Text style={[styles.summaryLabel, { color: mutedText }]}>
              Total Expenses
            </Text>

            <Text style={[styles.summaryAmount, { color: RED }]}>
              KSh {formatCurrency(totalExpense)}
            </Text>

          </View>


          {/* BALANCE */}

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >

            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: isDarkMode ? "#263D63" : "#EAF0FF" },
              ]}
            >
              <MaterialCommunityIcons
                name="wallet-outline"
                size={22}
                color={BLUE}
              />
            </View>

            <Text style={[styles.summaryLabel, { color: mutedText }]}>
              Net Balance
            </Text>

            <Text
              style={[
                styles.summaryAmount,
                { color: balance >= 0 ? GREEN : RED },
              ]}
            >
              {balance < 0 ? "-" : ""}KSh {formatCurrency(Math.abs(balance))}
            </Text>

          </View>


          {/* TRANSACTIONS */}

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >

            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: isDarkMode ? "#3A3157" : "#F0EBFF" },
              ]}
            >
              <MaterialCommunityIcons
                name="swap-horizontal"
                size={22}
                color={PURPLE}
              />
            </View>

            <Text style={[styles.summaryLabel, { color: mutedText }]}>
              Transactions
            </Text>

            <Text style={[styles.summaryAmount, { color: colors.text }]}>
              {transactionCount}
            </Text>

          </View>

        </View>


        {/* =============================================
            INCOME VS EXPENSES
        ============================================= */}

        <SectionTitle
          title="Income vs Expenses"
          subtitle="Compare money received and money spent"
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >

          <View style={styles.legendRow}>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
              <Text style={[styles.legendText, { color: mutedText }]}>
                Income
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: RED }]} />
              <Text style={[styles.legendText, { color: mutedText }]}>
                Expenses
              </Text>
            </View>

          </View>


          {/* INCOME BAR */}

          <View style={styles.comparisonRow}>

            <View style={styles.comparisonHeading}>

              <Text style={[styles.comparisonLabel, { color: colors.text }]}>
                Income
              </Text>

              <Text style={[styles.comparisonValue, { color: GREEN }]}>
                KSh {formatCurrency(totalIncome)}
              </Text>

            </View>

            <View
              style={[
                styles.chartTrack,
                { backgroundColor: mutedBackground },
              ]}
            >

              <View
                style={[
                  styles.chartBar,
                  {
                    width: `${(totalIncome / comparisonMax) * 100}%`,
                    backgroundColor: GREEN,
                  },
                ]}
              />

            </View>

          </View>


          {/* EXPENSE BAR */}

          <View style={styles.comparisonRow}>

            <View style={styles.comparisonHeading}>

              <Text style={[styles.comparisonLabel, { color: colors.text }]}>
                Expenses
              </Text>

              <Text style={[styles.comparisonValue, { color: RED }]}>
                KSh {formatCurrency(totalExpense)}
              </Text>

            </View>

            <View
              style={[
                styles.chartTrack,
                { backgroundColor: mutedBackground },
              ]}
            >

              <View
                style={[
                  styles.chartBar,
                  {
                    width: `${(totalExpense / comparisonMax) * 100}%`,
                    backgroundColor: RED,
                  },
                ]}
              />

            </View>

          </View>

          {totalIncome === 0 && totalExpense === 0 && (
            <EmptyState message="No income or expense data available for this period." />
          )}

        </View>


        {/* =============================================
            SIX MONTH CHART
        ============================================= */}

        <SectionTitle
          title="Six-Month Overview"
          subtitle="Your income and expenses over the last six months"
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >

          <View style={styles.legendRow}>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
              <Text style={[styles.legendText, { color: mutedText }]}>
                Income
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: RED }]} />
              <Text style={[styles.legendText, { color: mutedText }]}>
                Expenses
              </Text>
            </View>

          </View>

          {sixMonthMax === 0 ? (

            <EmptyState message="No transaction data available for the last six months." />

          ) : (

            <View style={styles.sixMonthChart}>

              {sixMonthData.map((item) => {

                const incomeHeight =
                  (item.income / sixMonthMax) * 145;

                const expenseHeight =
                  (item.expense / sixMonthMax) * 145;

                return (

                  <View
                    key={item.key}
                    style={styles.monthColumn}
                  >

                    <View style={styles.monthBarsArea}>

                      <View style={styles.barPair}>

                        <View
                          style={[
                            styles.monthBar,
                            {
                              height: item.income > 0
                                ? Math.max(incomeHeight, 4)
                                : 0,
                              backgroundColor: GREEN,
                            },
                          ]}
                        />

                      </View>

                      <View style={styles.barPair}>

                        <View
                          style={[
                            styles.monthBar,
                            {
                              height: item.expense > 0
                                ? Math.max(expenseHeight, 4)
                                : 0,
                              backgroundColor: RED,
                            },
                          ]}
                        />

                      </View>

                    </View>

                    <Text style={[styles.monthLabel, { color: colors.text }]}>
                      {item.month}
                    </Text>

                  </View>

                );

              })}

            </View>

          )}

          <View style={[styles.chartNote, { borderTopColor: subtleBorder }]}>

            <MaterialCommunityIcons
              name="information-outline"
              size={15}
              color={mutedText}
            />

            <Text style={[styles.chartNoteText, { color: mutedText }]}>
              Bar heights represent actual recorded transaction amounts.
            </Text>

          </View>

        </View>


        {/* =============================================
            SPENDING OVERVIEW
        ============================================= */}

        <SectionTitle
          title="Spending Overview"
          subtitle="Identify where most of your money goes"
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >

          {highestExpenseCategory ? (

            <View style={styles.highestCategory}>

              <View
                style={[
                  styles.highestIcon,
                  { backgroundColor: isDarkMode ? "#49312E" : "#FCEDE9" },
                ]}
              >
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={25}
                  color={RED}
                />
              </View>

              <View style={styles.highestInfo}>

                <Text style={[styles.highestLabel, { color: mutedText }]}>
                  Highest spending category
                </Text>

                <Text style={[styles.highestName, { color: colors.text }]}>
                  {highestExpenseCategory.category}
                </Text>

              </View>

              <Text style={[styles.highestAmount, { color: RED }]}>
                KSh {formatCurrency(highestExpenseCategory.amount)}
              </Text>

            </View>

          ) : (

            <EmptyState message="No expense data available for this period." />

          )}

        </View>


        {/* =============================================
            EXPENSE BY CATEGORY
        ============================================= */}

        <SectionTitle
          title="Expenses by Category"
          subtitle="Breakdown of your spending"
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >

          <CategoryReport
            items={expenseByCategory}
            total={totalExpense}
            type="Expense"
          />

        </View>


        {/* =============================================
            INCOME BY CATEGORY
        ============================================= */}

        <SectionTitle
          title="Income by Category"
          subtitle="Where your money comes from"
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >

          <CategoryReport
            items={incomeByCategory}
            total={totalIncome}
            type="Income"
          />

        </View>


        {/* =============================================
            BUDGET VS SPENDING
        ============================================= */}

        <SectionTitle
          title="Budget vs Spending"
          subtitle="Monitor your monthly spending limit"
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >

          {budgetAmount > 0 ? (

            <>

              <View style={styles.budgetHeader}>

                <View>

                  <Text style={[styles.budgetLabel, { color: mutedText }]}>
                    Monthly Budget
                  </Text>

                  <Text style={[styles.budgetValue, { color: colors.text }]}>
                    KSh {formatCurrency(budgetAmount)}
                  </Text>

                </View>

                <View style={styles.budgetPercentageContainer}>

                  <Text
                    style={[
                      styles.budgetPercentage,
                      {
                        color: budgetPercentage > 100
                          ? RED
                          : budgetPercentage >= 80
                            ? AMBER
                            : GREEN,
                      },
                    ]}
                  >
                    {Math.round(budgetPercentage)}%
                  </Text>

                  <Text style={[styles.budgetUsed, { color: mutedText }]}>
                    used
                  </Text>

                </View>

              </View>


              <View
                style={[
                  styles.budgetTrack,
                  { backgroundColor: mutedBackground },
                ]}
              >

                <View
                  style={[
                    styles.budgetProgress,
                    {
                      width: `${safeBudgetPercentage}%`,
                      backgroundColor: budgetPercentage > 100
                        ? RED
                        : budgetPercentage >= 80
                          ? AMBER
                          : GREEN,
                    },
                  ]}
                />

              </View>


              <View style={styles.budgetFooter}>

                <View>

                  <Text style={[styles.budgetFooterLabel, { color: mutedText }]}>
                    Actual spending
                  </Text>

                  <Text style={[styles.budgetFooterValue, { color: RED }]}>
                    KSh {formatCurrency(totalExpense)}
                  </Text>

                </View>

                <View style={styles.budgetRemaining}>

                  <Text style={[styles.budgetFooterLabel, { color: mutedText }]}>
                    {budgetDifference >= 0 ? "Remaining" : "Over budget"}
                  </Text>

                  <Text
                    style={[
                      styles.budgetFooterValue,
                      { color: budgetDifference >= 0 ? GREEN : RED },
                    ]}
                  >
                    KSh {formatCurrency(Math.abs(budgetDifference))}
                  </Text>

                </View>

              </View>

            </>

          ) : (

            <View style={styles.noBudgetContainer}>

              <View
                style={[
                  styles.noBudgetIcon,
                  { backgroundColor: isDarkMode ? "#263D63" : "#EAF0FF" },
                ]}
              >

                <MaterialCommunityIcons
                  name="wallet-plus-outline"
                  size={29}
                  color={BLUE}
                />

              </View>

              <Text style={[styles.noBudgetTitle, { color: colors.text }]}>
                No Monthly Budget Set
              </Text>

              <Text style={[styles.noBudgetText, { color: mutedText }]}>
                Create a monthly budget to compare your planned spending with your actual expenses.
              </Text>

              <Pressable
                style={styles.manageBudgetButton}
                onPress={() => router.push("/budget")}
              >

                <MaterialCommunityIcons
                  name="wallet-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text style={styles.manageBudgetText}>
                  Manage Budget
                </Text>

              </Pressable>

            </View>

          )}

        </View>


        {/* =============================================
            REPORT DETAILS
        ============================================= */}

        <SectionTitle
          title="Report Details"
          subtitle="Additional financial information"
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >

          <View style={styles.detailRow}>

            <View style={styles.detailLeft}>

              <MaterialCommunityIcons
                name="arrow-down-circle-outline"
                size={20}
                color={GREEN}
              />

              <Text style={[styles.detailLabel, { color: mutedText }]}>
                Income transactions
              </Text>

            </View>

            <Text style={[styles.detailValue, { color: colors.text }]}>
              {incomeCount}
            </Text>

          </View>

          <View style={styles.detailRow}>

            <View style={styles.detailLeft}>

              <MaterialCommunityIcons
                name="arrow-up-circle-outline"
                size={20}
                color={RED}
              />

              <Text style={[styles.detailLabel, { color: mutedText }]}>
                Expense transactions
              </Text>

            </View>

            <Text style={[styles.detailValue, { color: colors.text }]}>
              {expenseCount}
            </Text>

          </View>

          <View style={styles.detailRow}>

            <View style={styles.detailLeft}>

              <MaterialCommunityIcons
                name="calculator-variant-outline"
                size={20}
                color={PURPLE}
              />

              <Text style={[styles.detailLabel, { color: mutedText }]}>
                Average expense
              </Text>

            </View>

            <Text style={[styles.detailValue, { color: colors.text }]}>
              KSh {formatCurrency(averageExpense)}
            </Text>

          </View>

          <View style={[styles.detailRow, styles.lastDetailRow]}>

            <View style={styles.detailLeft}>

              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={20}
                color={BLUE}
              />

              <Text style={[styles.detailLabel, { color: mutedText }]}>
                Total transactions
              </Text>

            </View>

            <Text style={[styles.detailValue, { color: colors.text }]}>
              {transactionCount}
            </Text>

          </View>

        </View>


        {/* =============================================
            VIEW TRANSACTIONS BUTTON
        ============================================= */}

        <Pressable
          style={styles.transactionsButton}
          onPress={() => router.push("/transactions")}
        >

          <MaterialCommunityIcons
            name="receipt-text-outline"
            size={20}
            color="#FFFFFF"
          />

          <Text style={styles.transactionsButtonText}>
            View All Transactions
          </Text>

          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color="#FFFFFF"
          />

        </Pressable>

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
    marginTop: 14,
    fontSize: 14,
    fontWeight: "500",
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 35,
  },


  // HEADER

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitleContainer: {
    flex: 1,
    marginLeft: 13,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },


  // PERIOD

  periodCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 25,
  },

  periodHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 9,
  },

  periodTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  periodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 11,
  },

  periodButtonText: {
    fontSize: 11,
    fontWeight: "700",
  },


  // SECTION HEADINGS

  sectionHeading: {
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },


  // SUMMARY

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 27,
    gap: 10,
  },

  summaryCard: {
    width: "48%",
    borderRadius: 17,
    borderWidth: 1,
    padding: 14,
    minHeight: 128,
  },

  summaryIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 5,
  },

  summaryAmount: {
    fontSize: 15,
    fontWeight: "800",
  },


  // GENERAL CARD

  card: {
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    marginBottom: 27,
  },


  // LEGEND

  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 22,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
  },

  legendText: {
    fontSize: 12,
    fontWeight: "600",
  },


  // COMPARISON

  comparisonRow: {
    marginBottom: 21,
  },

  comparisonHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },

  comparisonLabel: {
    fontSize: 13,
    fontWeight: "700",
  },

  comparisonValue: {
    fontSize: 12,
    fontWeight: "800",
  },

  chartTrack: {
    height: 12,
    borderRadius: 8,
    overflow: "hidden",
  },

  chartBar: {
    height: 12,
    borderRadius: 8,
  },


  // SIX MONTH CHART

  sixMonthChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 190,
    paddingTop: 10,
  },

  monthColumn: {
    flex: 1,
    alignItems: "center",
  },

  monthBarsArea: {
    height: 145,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },

  barPair: {
    width: 13,
    height: 145,
    justifyContent: "flex-end",
    marginHorizontal: 2,
  },

  monthBar: {
    width: 13,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },

  monthLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 9,
  },

  chartNote: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 13,
    marginTop: 14,
    gap: 7,
  },

  chartNoteText: {
    fontSize: 10,
    flex: 1,
  },


  // EMPTY STATE

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 15,
  },

  emptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  emptyText: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 19,
  },


  // HIGHEST CATEGORY

  highestCategory: {
    flexDirection: "row",
    alignItems: "center",
  },

  highestIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  highestInfo: {
    flex: 1,
  },

  highestLabel: {
    fontSize: 10,
    marginBottom: 5,
  },

  highestName: {
    fontSize: 14,
    fontWeight: "800",
  },

  highestAmount: {
    fontSize: 12,
    fontWeight: "800",
  },


  // CATEGORY BREAKDOWN

  categoryItem: {
    marginBottom: 21,
  },

  categoryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 11,
  },

  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },

  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  categoryNameContainer: {
    flex: 1,
  },

  categoryName: {
    fontSize: 12,
    fontWeight: "700",
  },

  categoryPercentage: {
    fontSize: 10,
    marginTop: 3,
  },

  categoryAmount: {
    fontSize: 11,
    fontWeight: "800",
  },

  categoryTrack: {
    height: 8,
    borderRadius: 8,
    overflow: "hidden",
  },

  categoryProgress: {
    height: 8,
    borderRadius: 8,
  },


  // BUDGET

  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 17,
  },

  budgetLabel: {
    fontSize: 11,
    fontWeight: "600",
  },

  budgetValue: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 6,
  },

  budgetPercentageContainer: {
    alignItems: "flex-end",
  },

  budgetPercentage: {
    fontSize: 21,
    fontWeight: "900",
  },

  budgetUsed: {
    fontSize: 10,
    marginTop: 2,
  },

  budgetTrack: {
    height: 13,
    borderRadius: 8,
    overflow: "hidden",
  },

  budgetProgress: {
    height: 13,
    borderRadius: 8,
  },

  budgetFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 17,
  },

  budgetFooterLabel: {
    fontSize: 10,
    marginBottom: 5,
  },

  budgetFooterValue: {
    fontSize: 12,
    fontWeight: "800",
  },

  budgetRemaining: {
    alignItems: "flex-end",
  },


  // NO BUDGET

  noBudgetContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },

  noBudgetIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },

  noBudgetTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 7,
  },

  noBudgetText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 17,
  },

  manageBudgetButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  manageBudgetText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },


  // REPORT DETAILS

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E9EEF3",
  },

  lastDetailRow: {
    borderBottomWidth: 0,
  },

  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  detailValue: {
    fontSize: 13,
    fontWeight: "800",
  },


  // TRANSACTIONS BUTTON

  transactionsButton: {
    height: 53,
    backgroundColor: GREEN,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 11,
    marginTop: 1,
  },

  transactionsButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  bottomSpace: {
    height: 25,
  },

});