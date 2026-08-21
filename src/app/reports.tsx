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

import { useAuth } from "@/context/AuthContext";

import {
  useTheme,
} from "@/context/ThemeContext";

import {
  getTransactions,
  Transaction,
} from "@/services/transactionService";

import {
  getBudgets,
  Budget,
} from "@/services/budgetService";


// =====================================================
// REPORT PERIOD
// =====================================================

type ReportPeriod =
  | "This Month"
  | "Last Month"
  | "This Year"
  | "All Time";


// =====================================================
// SIX MONTH DATA TYPE
// =====================================================

type MonthlyReport = {
  key: string;
  month: string;
  fullMonth: string;
  income: number;
  expense: number;
};


// =====================================================
// REPORT SCREEN
// =====================================================

export default function ReportsScreen() {

  // ===================================================
  // AUTH
  // ===================================================

  const { token } = useAuth();


  // ===================================================
  // THEME
  // ===================================================

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
  // REFRESH
  // ===================================================

  const refreshReports = async () => {

    if (!token) {
      return;
    }

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

  const currentMonth =
    now.getMonth() + 1;

  const currentYear =
    now.getFullYear();


  // ===================================================
  // LAST MONTH
  // ===================================================

  const lastMonthDate =
    new Date(
      currentYear,
      currentMonth - 2,
      1
    );

  const lastMonth =
    lastMonthDate.getMonth() + 1;

  const lastMonthYear =
    lastMonthDate.getFullYear();


  // ===================================================
  // FILTER TRANSACTIONS
  // ===================================================

  const filteredTransactions =
    useMemo(() => {

      return transactions.filter(
        (transaction) => {

          if (
            period === "All Time"
          ) {

            return true;

          }


          if (
            !transaction.transaction_date
          ) {

            return false;

          }


          const date =
            new Date(
              transaction.transaction_date
            );


          if (
            Number.isNaN(
              date.getTime()
            )
          ) {

            return false;

          }


          const month =
            date.getMonth() + 1;

          const year =
            date.getFullYear();


          if (
            period === "This Month"
          ) {

            return (
              month === currentMonth &&
              year === currentYear
            );

          }


          if (
            period === "Last Month"
          ) {

            return (
              month === lastMonth &&
              year === lastMonthYear
            );

          }


          if (
            period === "This Year"
          ) {

            return (
              year === currentYear
            );

          }


          return true;

        }
      );

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

  const totalIncome =
    useMemo(() => {

      return filteredTransactions.reduce(
        (total, transaction) => {

          if (
            transaction.type !== "Income"
          ) {

            return total;

          }

          return (
            total +
            Number(
              transaction.amount || 0
            )
          );

        },
        0
      );

    }, [filteredTransactions]);


  // ===================================================
  // TOTAL EXPENSE
  // ===================================================

  const totalExpense =
    useMemo(() => {

      return filteredTransactions.reduce(
        (total, transaction) => {

          if (
            transaction.type !== "Expense"
          ) {

            return total;

          }

          return (
            total +
            Number(
              transaction.amount || 0
            )
          );

        },
        0
      );

    }, [filteredTransactions]);


  // ===================================================
  // BALANCE
  // ===================================================

  const balance =
    totalIncome -
    totalExpense;


  // ===================================================
  // EXPENSE BY CATEGORY
  // ===================================================

  const expenseByCategory =
    useMemo(() => {

      const categoryMap:
        Record<string, number> = {};


      filteredTransactions.forEach(
        (transaction) => {

          if (
            transaction.type !== "Expense"
          ) {

            return;

          }


          const category =
            transaction.category_name ||
            "Uncategorized";


          const amount =
            Number(
              transaction.amount || 0
            );


          categoryMap[category] =
            (
              categoryMap[category] || 0
            ) + amount;

        }
      );


      return Object.entries(
        categoryMap
      )
        .map(
          ([
            category,
            amount,
          ]) => ({
            category,
            amount,
          })
        )
        .sort(
          (a, b) =>
            b.amount - a.amount
        );

    }, [filteredTransactions]);


  // ===================================================
  // INCOME BY CATEGORY
  // ===================================================

  const incomeByCategory =
    useMemo(() => {

      const categoryMap:
        Record<string, number> = {};


      filteredTransactions.forEach(
        (transaction) => {

          if (
            transaction.type !== "Income"
          ) {

            return;

          }


          const category =
            transaction.category_name ||
            "Uncategorized";


          const amount =
            Number(
              transaction.amount || 0
            );


          categoryMap[category] =
            (
              categoryMap[category] || 0
            ) + amount;

        }
      );


      return Object.entries(
        categoryMap
      )
        .map(
          ([
            category,
            amount,
          ]) => ({
            category,
            amount,
          })
        )
        .sort(
          (a, b) =>
            b.amount - a.amount
        );

    }, [filteredTransactions]);


  // ===================================================
  // HIGHEST EXPENSE CATEGORY
  // ===================================================

  const highestExpenseCategory =
    expenseByCategory.length > 0
      ? expenseByCategory[0]
      : null;


  // ===================================================
  // TRANSACTION COUNT
  // ===================================================

  const transactionCount =
    filteredTransactions.length;


  // ===================================================
  // CURRENT MONTH BUDGET
  // ===================================================

  const currentBudget =
    budgets.find(
      (budget) => {

        const budgetMonth =
          Number(
            budget.month
          );

        const budgetYear =
          Number(
            budget.year
          );


        return (
          budgetMonth === currentMonth &&
          budgetYear === currentYear
        );

      }
    );


  // ===================================================
  // BUDGET AMOUNT
  // ===================================================

  const budgetAmount =
    currentBudget
      ? Number(
          currentBudget.budget_amount
        ) || 0
      : 0;


  // ===================================================
  // BUDGET PERCENTAGE
  // ===================================================

  const budgetPercentage =
    budgetAmount > 0
      ? (
          totalExpense /
          budgetAmount
        ) * 100
      : 0;


  const safeBudgetPercentage =
    Math.min(
      Math.max(
        budgetPercentage,
        0
      ),
      100
    );


  // ===================================================
  // SIX MONTH REPORT
  //
  // IMPORTANT:
  // This is calculated from REAL backend
  // transaction data.
  // ===================================================

  const sixMonthData =
    useMemo<MonthlyReport[]>(() => {

      const result: MonthlyReport[] = [];


      for (
        let i = 5;
        i >= 0;
        i--
      ) {

        const date =
          new Date(
            currentYear,
            currentMonth - 1 - i,
            1
          );


        const month =
          date.getMonth() + 1;

        const year =
          date.getFullYear();


        const monthName =
          date.toLocaleString(
            "en-US",
            {
              month: "short",
            }
          );


        const fullMonth =
          date.toLocaleString(
            "en-US",
            {
              month: "long",
              year: "numeric",
            }
          );


        let income = 0;
        let expense = 0;


        transactions.forEach(
          (transaction) => {

            if (
              !transaction.transaction_date
            ) {

              return;

            }


            const transactionDate =
              new Date(
                transaction.transaction_date
              );


            if (
              Number.isNaN(
                transactionDate.getTime()
              )
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


            const amount =
              Number(
                transaction.amount || 0
              );


            if (
              transaction.type === "Income"
            ) {

              income += amount;

            }


            if (
              transaction.type === "Expense"
            ) {

              expense += amount;

            }

          }
        );


        result.push({
          key:
            `${year}-${month}`,
          month:
            monthName,
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

  const sixMonthMax =
    useMemo(() => {

      let max = 0;


      sixMonthData.forEach(
        (item) => {

          max =
            Math.max(
              max,
              item.income,
              item.expense
            );

        }
      );


      return max;

    }, [sixMonthData]);


  // ===================================================
  // CURRENT PERIOD INCOME VS EXPENSE
  // ===================================================

  const comparisonMax =
    Math.max(
      totalIncome,
      totalExpense,
      1
    );


  // ===================================================
  // FORMAT CURRENCY
  // ===================================================

  const formatCurrency =
    (amount: number) => {

      return Number(
        amount || 0
      ).toLocaleString(
        "en-KE"
      );

    };


  // ===================================================
  // LOADING
  // ===================================================

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
          Loading reports...
        </Text>

      </SafeAreaView>

    );

  }


  // ===================================================
  // SCREEN
  // ===================================================

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={
              refreshReports
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

        <View
          style={styles.header}
        >

          <Pressable
            style={[
              styles.backButtonContainer,
              {
                backgroundColor:
                  colors.card,
                borderColor:
                  colors.border,
              },
            ]}
            onPress={() =>
              router.back()
            }
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


          <Text
            style={[
              styles.title,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Reports
          </Text>


          <View
            style={
              styles.headerSpace
            }
          />

        </View>


        {/* =================================================
            PERIOD FILTER
        ================================================= */}

        <View
          style={[
            styles.periodCard,
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
              styles.periodTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Report Period
          </Text>


          <View
            style={styles.periodRow}
          >

            {(
              [
                "This Month",
                "Last Month",
                "This Year",
                "All Time",
              ] as ReportPeriod[]
            ).map(
              (item) => (

                <Pressable
                  key={item}
                  style={[
                    styles.periodButton,

                    {
                      backgroundColor:
                        colors.iconBackground,
                    },

                    period === item &&
                      {
                        backgroundColor:
                          colors.primary,
                      },
                  ]}
                  onPress={() =>
                    setPeriod(item)
                  }
                >

                  <Text
                    style={[
                      styles.periodButtonText,
                      {
                        color:
                          colors.secondaryText,
                      },

                      period === item &&
                        {
                          color:
                            colors.white,
                        },
                    ]}
                  >
                    {item}
                  </Text>

                </Pressable>

              )
            )}

          </View>

        </View>


        {/* =================================================
            FINANCIAL SUMMARY
        ================================================= */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.text,
            },
          ]}
        >
          Financial Summary
        </Text>


        <View
          style={styles.summaryGrid}
        >

          {/* INCOME */}

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor:
                  colors.card,
                borderColor:
                  colors.border,
                borderLeftColor:
                  colors.success,
              },
            ]}
          >

            <Text
              style={[
                styles.summaryLabel,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              Income
            </Text>

            <Text
              style={[
                styles.summaryAmount,
                {
                  color:
                    colors.success,
                },
              ]}
            >
              KSh{" "}
              {formatCurrency(
                totalIncome
              )}
            </Text>

          </View>


          {/* EXPENSE */}

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor:
                  colors.card,
                borderColor:
                  colors.border,
                borderLeftColor:
                  colors.danger,
              },
            ]}
          >

            <Text
              style={[
                styles.summaryLabel,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              Expenses
            </Text>

            <Text
              style={[
                styles.summaryAmount,
                {
                  color:
                    colors.danger,
                },
              ]}
            >
              KSh{" "}
              {formatCurrency(
                totalExpense
              )}
            </Text>

          </View>


          {/* BALANCE */}

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor:
                  colors.card,
                borderColor:
                  colors.border,
                borderLeftColor:
                  colors.primary,
              },
            ]}
          >

            <Text
              style={[
                styles.summaryLabel,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              Balance
            </Text>

            <Text
              style={[
                styles.summaryAmount,
                {
                  color:
                    balance >= 0
                      ? colors.success
                      : colors.danger,
                },
              ]}
            >
              KSh{" "}
              {formatCurrency(
                Math.abs(balance)
              )}
            </Text>

          </View>


          {/* TRANSACTIONS */}

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor:
                  colors.card,
                borderColor:
                  colors.border,
                borderLeftColor:
                  "#7C3AED",
              },
            ]}
          >

            <Text
              style={[
                styles.summaryLabel,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              Transactions
            </Text>

            <Text
              style={[
                styles.summaryAmount,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              {transactionCount}
            </Text>

          </View>

        </View>


        {/* =================================================
            INCOME VS EXPENSE
        ================================================= */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.text,
            },
          ]}
        >
          Income vs Expenses
        </Text>


        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >

          <View
            style={
              styles.chartLegend
            }
          >

            <View
              style={
                styles.legendItem
              }
            >

              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      colors.success,
                  },
                ]}
              />

              <Text
                style={[
                  styles.legendText,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                Income
              </Text>

            </View>


            <View
              style={
                styles.legendItem
              }
            >

              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      colors.danger,
                  },
                ]}
              />

              <Text
                style={[
                  styles.legendText,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                Expenses
              </Text>

            </View>

          </View>


          {/* INCOME BAR */}

          <View
            style={
              styles.comparisonRow
            }
          >

            <View
              style={
                styles.comparisonLabelRow
              }
            >

              <Text
                style={[
                  styles.comparisonLabel,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Income
              </Text>

              <Text
                style={[
                  styles.comparisonAmount,
                  {
                    color:
                      colors.success,
                  },
                ]}
              >
                KSh{" "}
                {formatCurrency(
                  totalIncome
                )}
              </Text>

            </View>


            <View
              style={[
                styles.chartTrack,
                {
                  backgroundColor:
                    colors.iconBackground,
                },
              ]}
            >

              <View
                style={[
                  styles.chartBar,
                  {
                    width:
                      `${Math.min(
                        (
                          totalIncome /
                          comparisonMax
                        ) * 100,
                        100
                      )}%`,
                    backgroundColor:
                      colors.success,
                  },
                ]}
              />

            </View>

          </View>


          {/* EXPENSE BAR */}

          <View
            style={
              styles.comparisonRow
            }
          >

            <View
              style={
                styles.comparisonLabelRow
              }
            >

              <Text
                style={[
                  styles.comparisonLabel,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Expenses
              </Text>

              <Text
                style={[
                  styles.comparisonAmount,
                  {
                    color:
                      colors.danger,
                  },
                ]}
              >
                KSh{" "}
                {formatCurrency(
                  totalExpense
                )}
              </Text>

            </View>


            <View
              style={[
                styles.chartTrack,
                {
                  backgroundColor:
                    colors.iconBackground,
                },
              ]}
            >

              <View
                style={[
                  styles.chartBar,
                  {
                    width:
                      `${Math.min(
                        (
                          totalExpense /
                          comparisonMax
                        ) * 100,
                        100
                      )}%`,
                    backgroundColor:
                      colors.danger,
                  },
                ]}
              />

            </View>

          </View>


          {totalIncome === 0 &&
            totalExpense === 0 && (

              <Text
                style={[
                  styles.emptyText,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                No income or expense data
                available for this period.
              </Text>

            )}

        </View>


        {/* =================================================
            SIX MONTH COMPARISON
        ================================================= */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.text,
            },
          ]}
        >
          Six-Month Income vs Expenses
        </Text>


        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >

          <View
            style={
              styles.chartLegend
            }
          >

            <View
              style={
                styles.legendItem
              }
            >

              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      colors.success,
                  },
                ]}
              />

              <Text
                style={[
                  styles.legendText,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                Income
              </Text>

            </View>


            <View
              style={
                styles.legendItem
              }
            >

              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      colors.danger,
                  },
                ]}
              />

              <Text
                style={[
                  styles.legendText,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                Expenses
              </Text>

            </View>

          </View>


          {sixMonthMax === 0 ? (

            <Text
              style={[
                styles.emptyText,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              No transaction data available
              for the last six months.
            </Text>

          ) : (

            <View
              style={
                styles.sixMonthChart
              }
            >

              {sixMonthData.map(
                (item) => {

                  const incomeHeight =
                    sixMonthMax > 0
                      ? (
                          item.income /
                          sixMonthMax
                        ) * 140
                      : 0;


                  const expenseHeight =
                    sixMonthMax > 0
                      ? (
                          item.expense /
                          sixMonthMax
                        ) * 140
                      : 0;


                  return (

                    <View
                      key={item.key}
                      style={
                        styles.monthColumn
                      }
                    >

                      {/* VALUES */}

                      <View
                        style={
                          styles.monthBarsArea
                        }
                      >

                        <View
                          style={
                            styles.barPair
                          }
                        >

                          <View
                            style={[
                              styles.monthBar,
                              {
                                height:
                                  Math.max(
                                    incomeHeight,
                                    item.income > 0
                                      ? 4
                                      : 0
                                  ),
                                backgroundColor:
                                  colors.success,
                              },
                            ]}
                          />

                        </View>


                        <View
                          style={
                            styles.barPair
                          }
                        >

                          <View
                            style={[
                              styles.monthBar,
                              {
                                height:
                                  Math.max(
                                    expenseHeight,
                                    item.expense > 0
                                      ? 4
                                      : 0
                                  ),
                                backgroundColor:
                                  colors.danger,
                              },
                            ]}
                          />

                        </View>

                      </View>


                      {/* MONTH */}

                      <Text
                        style={[
                          styles.monthLabel,
                          {
                            color:
                              colors.secondaryText,
                          },
                        ]}
                      >
                        {item.month}
                      </Text>


                      {/* TOTALS */}

                      <Text
                        style={[
                          styles.monthIncomeValue,
                          {
                            color:
                              colors.success,
                          },
                        ]}
                      >
                        {item.income > 0
                          ? `${(
                              item.income / 1000
                            ).toFixed(1)}k`
                          : "-"}
                      </Text>


                      <Text
                        style={[
                          styles.monthExpenseValue,
                          {
                            color:
                              colors.danger,
                          },
                        ]}
                      >
                        {item.expense > 0
                          ? `${(
                              item.expense / 1000
                            ).toFixed(1)}k`
                          : "-"}
                      </Text>

                    </View>

                  );

                }
              )}

            </View>

          )}

        </View>


        {/* =================================================
            TOP SPENDING
        ================================================= */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.text,
            },
          ]}
        >
          Spending Overview
        </Text>


        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >

          {highestExpenseCategory ? (

            <>

              <Text
                style={[
                  styles.cardSubtitle,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                Highest spending category
              </Text>


              <View
                style={
                  styles.highestCategoryRow
                }
              >

                <Text
                  style={[
                    styles.highestCategoryName,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  {
                    highestExpenseCategory.category
                  }
                </Text>


                <Text
                  style={[
                    styles.highestCategoryAmount,
                    {
                      color:
                        colors.danger,
                    },
                  ]}
                >
                  KSh{" "}
                  {formatCurrency(
                    highestExpenseCategory.amount
                  )}
                </Text>

              </View>

            </>

          ) : (

            <Text
              style={[
                styles.emptyText,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              No expense data available
              for this period.
            </Text>

          )}

        </View>


        {/* =================================================
            EXPENSE BY CATEGORY
        ================================================= */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.text,
            },
          ]}
        >
          Expenses by Category
        </Text>


        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >

          {expenseByCategory.length === 0 ? (

            <Text
              style={[
                styles.emptyText,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              No expense transactions
              found for this period.
            </Text>

          ) : (

            expenseByCategory.map(
              (item) => {

                const percentage =
                  totalExpense > 0
                    ? (
                        item.amount /
                        totalExpense
                      ) * 100
                    : 0;


                return (

                  <View
                    key={
                      item.category
                    }
                    style={
                      styles.categoryRow
                    }
                  >

                    <View
                      style={
                        styles.categoryHeader
                      }
                    >

                      <Text
                        style={[
                          styles.categoryName,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        {item.category}
                      </Text>


                      <Text
                        style={[
                          styles.categoryAmount,
                          {
                            color:
                              colors.danger,
                          },
                        ]}
                      >
                        KSh{" "}
                        {formatCurrency(
                          item.amount
                        )}
                      </Text>

                    </View>


                    <View
                      style={[
                        styles.barBackground,
                        {
                          backgroundColor:
                            colors.iconBackground,
                        },
                      ]}
                    >

                      <View
                        style={[
                          styles.bar,
                          {
                            width:
                              `${percentage}%`,
                            backgroundColor:
                              colors.danger,
                          },
                        ]}
                      />

                    </View>


                    <Text
                      style={[
                        styles.percentageText,
                        {
                          color:
                            colors.secondaryText,
                        },
                      ]}
                    >
                      {Math.round(
                        percentage
                      )}
                      %
                    </Text>

                  </View>

                );

              }
            )

          )}

        </View>


        {/* =================================================
            INCOME BY CATEGORY
        ================================================= */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.text,
            },
          ]}
        >
          Income by Category
        </Text>


        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >

          {incomeByCategory.length === 0 ? (

            <Text
              style={[
                styles.emptyText,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              No income transactions
              found for this period.
            </Text>

          ) : (

            incomeByCategory.map(
              (item) => {

                const percentage =
                  totalIncome > 0
                    ? (
                        item.amount /
                        totalIncome
                      ) * 100
                    : 0;


                return (

                  <View
                    key={
                      item.category
                    }
                    style={
                      styles.categoryRow
                    }
                  >

                    <View
                      style={
                        styles.categoryHeader
                      }
                    >

                      <Text
                        style={[
                          styles.categoryName,
                          {
                            color:
                              colors.text,
                          },
                        ]}
                      >
                        {item.category}
                      </Text>


                      <Text
                        style={[
                          styles.incomeCategoryAmount,
                          {
                            color:
                              colors.success,
                          },
                        ]}
                      >
                        KSh{" "}
                        {formatCurrency(
                          item.amount
                        )}
                      </Text>

                    </View>


                    <View
                      style={[
                        styles.barBackground,
                        {
                          backgroundColor:
                            colors.iconBackground,
                        },
                      ]}
                    >

                      <View
                        style={[
                          styles.incomeBar,
                          {
                            width:
                              `${percentage}%`,
                            backgroundColor:
                              colors.success,
                          },
                        ]}
                      />

                    </View>


                    <Text
                      style={[
                        styles.percentageText,
                        {
                          color:
                            colors.secondaryText,
                        },
                      ]}
                    >
                      {Math.round(
                        percentage
                      )}
                      %
                    </Text>

                  </View>

                );

              }
            )

          )}

        </View>


        {/* =================================================
            BUDGET VS SPENDING
        ================================================= */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.text,
            },
          ]}
        >
          Budget vs Spending
        </Text>


        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >

          {budgetAmount > 0 ? (

            <>

              <View
                style={
                  styles.budgetHeader
                }
              >

                <View>

                  <Text
                    style={[
                      styles.budgetLabel,
                      {
                        color:
                          colors.secondaryText,
                      },
                    ]}
                  >
                    Monthly Budget
                  </Text>

                  <Text
                    style={[
                      styles.budgetValue,
                      {
                        color:
                          colors.text,
                      },
                    ]}
                  >
                    KSh{" "}
                    {formatCurrency(
                      budgetAmount
                    )}
                  </Text>

                </View>


                <View
                  style={
                    styles.budgetRight
                  }
                >

                  <Text
                    style={[
                      budgetPercentage > 100
                        ? styles.overBudgetText
                        : styles.budgetPercentage,
                      {
                        color:
                          budgetPercentage > 100
                            ? colors.danger
                            : budgetPercentage >= 80
                            ? colors.warning
                            : colors.primary,
                      },
                    ]}
                  >
                    {Math.round(
                      budgetPercentage
                    )}
                    %
                  </Text>

                  <Text
                    style={[
                      styles.budgetSpentLabel,
                      {
                        color:
                          colors.secondaryText,
                      },
                    ]}
                  >
                    used
                  </Text>

                </View>

              </View>


              <View
                style={[
                  styles.budgetProgressBackground,
                  {
                    backgroundColor:
                      colors.iconBackground,
                  },
                ]}
              >

                <View
                  style={[
                    styles.budgetProgress,
                    {
                      width:
                        `${safeBudgetPercentage}%`,
                      backgroundColor:
                        budgetPercentage > 100
                          ? colors.danger
                          : budgetPercentage >= 80
                          ? colors.warning
                          : colors.primary,
                    },
                  ]}
                />

              </View>


              <View
                style={
                  styles.budgetFooter
                }
              >

                <Text
                  style={[
                    styles.budgetSpent,
                    {
                      color:
                        colors.secondaryText,
                    },
                  ]}
                >
                  Spent: KSh{" "}
                  {formatCurrency(
                    totalExpense
                  )}
                </Text>


                <Text
                  style={[
                    budgetAmount -
                      totalExpense >= 0
                      ? styles.remainingText
                      : styles.overBudgetText,
                    {
                      color:
                        budgetAmount -
                          totalExpense >= 0
                          ? colors.success
                          : colors.danger,
                    },
                  ]}
                >
                  {budgetAmount -
                    totalExpense >= 0
                    ? `Remaining: KSh ${formatCurrency(
                        budgetAmount -
                          totalExpense
                      )}`
                    : `Over: KSh ${formatCurrency(
                        Math.abs(
                          budgetAmount -
                            totalExpense
                        )
                      )}`}
                </Text>

              </View>

            </>

          ) : (

            <View
              style={
                styles.noBudgetContainer
              }
            >

              <Text
                style={[
                  styles.noBudgetTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                No Budget Set
              </Text>


              <Text
                style={[
                  styles.noBudgetText,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                Set a monthly budget to
                compare your planned
                spending with your actual
                expenses.
              </Text>


              <Pressable
                style={[
                  styles.goBudgetButton,
                  {
                    backgroundColor:
                      isDarkMode
                        ? "#1E3A8A"
                        : "#EFF6FF",
                  },
                ]}
                onPress={() =>
                  router.push(
                    "/budget"
                  )
                }
              >

                <Text
                  style={[
                    styles.goBudgetText,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  Manage Budget
                </Text>

              </Pressable>

            </View>

          )}

        </View>


        {/* =================================================
            REPORT DETAILS
        ================================================= */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.text,
            },
          ]}
        >
          Report Details
        </Text>


        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >

          <View
            style={
              styles.detailRow
            }
          >

            <Text
              style={[
                styles.detailLabel,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              Income transactions
            </Text>

            <Text
              style={[
                styles.detailValue,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              {
                filteredTransactions.filter(
                  (transaction) =>
                    transaction.type ===
                    "Income"
                ).length
              }
            </Text>

          </View>


          <View
            style={
              styles.detailRow
            }
          >

            <Text
              style={[
                styles.detailLabel,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              Expense transactions
            </Text>

            <Text
              style={[
                styles.detailValue,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              {
                filteredTransactions.filter(
                  (transaction) =>
                    transaction.type ===
                    "Expense"
                ).length
              }
            </Text>

          </View>


          <View
            style={
              styles.detailRow
            }
          >

            <Text
              style={[
                styles.detailLabel,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              Average expense
            </Text>

            <Text
              style={[
                styles.detailValue,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              KSh{" "}
              {formatCurrency(
                filteredTransactions.filter(
                  (transaction) =>
                    transaction.type ===
                    "Expense"
                ).length > 0
                  ? totalExpense /
                    filteredTransactions.filter(
                      (transaction) =>
                        transaction.type ===
                        "Expense"
                    ).length
                  : 0
              )}
            </Text>

          </View>

        </View>


        {/* =================================================
            VIEW ALL TRANSACTIONS
        ================================================= */}

        <Pressable
          style={[
            styles.transactionsButton,
            {
              backgroundColor:
                colors.primary,
            },
          ]}
          onPress={() =>
            router.push(
              "/transactions"
            )
          }
        >

          <Text
            style={[
              styles.transactionsButtonText,
              {
                color:
                  colors.white,
              },
            ]}
          >
            View All Transactions
          </Text>

        </Pressable>


        <View
          style={
            styles.bottomSpace
          }
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
    padding: 20,
    paddingBottom: 40,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  backButton: {
    fontSize: 38,
    lineHeight: 38,
  },

  headerSpace: {
    width: 40,
  },

  title: {
    fontSize: 23,
    fontWeight: "800",
  },


  // ===================================================
  // PERIOD
  // ===================================================

  periodCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },

  periodTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },

  periodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },

  periodButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },


  // ===================================================
  // SECTIONS
  // ===================================================

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 12,
  },


  // ===================================================
  // SUMMARY
  // ===================================================

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 26,
  },

  summaryCard: {
    width: "48%",
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
  },

  summaryLabel: {
    fontSize: 12,
    marginBottom: 7,
  },

  summaryAmount: {
    fontSize: 17,
    fontWeight: "800",
  },


  // ===================================================
  // CARD
  // ===================================================

  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 26,
    borderWidth: 1,
  },

  cardSubtitle: {
    fontSize: 12,
    marginBottom: 8,
  },


  // ===================================================
  // CHART LEGEND
  // ===================================================

  chartLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 18,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 7,
  },

  legendText: {
    fontSize: 12,
    fontWeight: "600",
  },


  // ===================================================
  // INCOME VS EXPENSE
  // ===================================================

  comparisonRow: {
    marginBottom: 18,
  },

  comparisonLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },

  comparisonLabel: {
    fontSize: 13,
    fontWeight: "600",
  },

  comparisonAmount: {
    fontSize: 13,
    fontWeight: "700",
  },

  chartTrack: {
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
  },

  chartBar: {
    height: 14,
    borderRadius: 7,
  },


  // ===================================================
  // SIX MONTH CHART
  // ===================================================

  sixMonthChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 210,
    paddingTop: 10,
  },

  monthColumn: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 2,
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
    minHeight: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  monthLabel: {
    fontSize: 11,
    marginTop: 7,
    fontWeight: "600",
  },

  monthIncomeValue: {
    fontSize: 8,
    marginTop: 3,
  },

  monthExpenseValue: {
    fontSize: 8,
    marginTop: 1,
  },


  // ===================================================
  // HIGHEST CATEGORY
  // ===================================================

  highestCategoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  highestCategoryName: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },

  highestCategoryAmount: {
    fontSize: 15,
    fontWeight: "800",
  },


  // ===================================================
  // CATEGORY
  // ===================================================

  categoryRow: {
    marginBottom: 18,
  },

  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },

  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  categoryAmount: {
    fontSize: 13,
    fontWeight: "700",
  },

  incomeCategoryAmount: {
    fontSize: 13,
    fontWeight: "700",
  },

  barBackground: {
    height: 9,
    borderRadius: 5,
    overflow: "hidden",
  },

  bar: {
    height: 9,
    borderRadius: 5,
  },

  incomeBar: {
    height: 9,
    borderRadius: 5,
  },

  percentageText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
  },


  // ===================================================
  // BUDGET
  // ===================================================

  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  budgetLabel: {
    fontSize: 12,
  },

  budgetValue: {
    fontSize: 17,
    fontWeight: "800",
    marginTop: 4,
  },

  budgetRight: {
    alignItems: "flex-end",
  },

  budgetPercentage: {
    fontSize: 18,
    fontWeight: "800",
  },

  overBudgetText: {
    fontSize: 18,
    fontWeight: "800",
  },

  budgetSpentLabel: {
    fontSize: 11,
  },

  budgetProgressBackground: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },

  budgetProgress: {
    height: 12,
    borderRadius: 6,
  },

  budgetFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  budgetSpent: {
    fontSize: 12,
  },

  remainingText: {
    fontSize: 12,
    fontWeight: "700",
  },


  // ===================================================
  // NO BUDGET
  // ===================================================

  noBudgetContainer: {
    alignItems: "flex-start",
  },

  noBudgetTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  noBudgetText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },

  goBudgetButton: {
    marginTop: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 9,
  },

  goBudgetText: {
    fontSize: 13,
    fontWeight: "700",
  },


  // ===================================================
  // DETAILS
  // ===================================================

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  detailLabel: {
    fontSize: 13,
  },

  detailValue: {
    fontSize: 13,
    fontWeight: "700",
  },


  // ===================================================
  // EMPTY
  // ===================================================

  emptyText: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
  },


  // ===================================================
  // TRANSACTIONS BUTTON
  // ===================================================

  transactionsButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  transactionsButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },

  bottomSpace: {
    height: 20,
  },

});