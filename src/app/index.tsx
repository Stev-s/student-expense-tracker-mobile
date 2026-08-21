import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  router,
  useFocusEffect,
} from 'expo-router';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';

import {
  getDashboardSummary,
  DashboardSummary,
} from '@/services/dashboardService';

import {
  getTransactions,
  Transaction,
} from '@/services/transactionService';

import {
  getBudgets,
  Budget,
} from '@/services/budgetService';


// =====================================================
// HOME / DASHBOARD
// =====================================================

export default function HomeScreen() {

  const {
    user,
    token,
    logout,
  } = useAuth();


  // =====================================================
  // DARK MODE
  // =====================================================

  const [darkMode, setDarkMode] = useState(false);


  const loadDarkMode = async () => {

    try {

      const storedDarkMode =
        await AsyncStorage.getItem('darkMode');

      setDarkMode(storedDarkMode === 'true');

    } catch (error) {

      console.error(
        'Error loading dark mode:',
        error
      );

    }

  };


  useEffect(() => {

    loadDarkMode();

  }, []);


  useFocusEffect(
    useCallback(() => {

      loadDarkMode();

    }, [])
  );


  // =====================================================
  // DASHBOARD DATA
  // =====================================================

  const [summary, setSummary] =
    useState<DashboardSummary>({
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      totalTransactions: 0,
    });


  const [transactions, setTransactions] =
    useState<Transaction[]>([]);


  const [budgets, setBudgets] =
    useState<Budget[]>([]);


  const [loadingBudget, setLoadingBudget] =
    useState(true);


  const [loading, setLoading] =
    useState(true);


  // =====================================================
  // MONTHS
  // =====================================================

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];


  const normalizeBudgetMonth = (
    month: string | number
  ): number => {

    if (typeof month === 'number') {
      return month;
    }

    const value =
      String(month)
        .trim()
        .toLowerCase();

    const numericMonth =
      Number(value);

    if (
      !Number.isNaN(numericMonth) &&
      numericMonth >= 1 &&
      numericMonth <= 12
    ) {
      return numericMonth;
    }

    const index =
      monthNames.findIndex(
        name =>
          name.toLowerCase() === value
      );

    return index + 1;
  };


  const getMonthName = (
    month: string | number
  ) => {

    const monthNumber =
      normalizeBudgetMonth(month);

    return (
      monthNames[monthNumber - 1] ||
      'Monthly'
    );

  };


  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard = async () => {

    if (!token) {

      setLoading(false);

      return;

    }

    try {

      setLoading(true);

      const dashboardResponse =
        await getDashboardSummary(token);

      if (dashboardResponse.success) {

        setSummary(
          dashboardResponse.summary
        );

      }


      const transactionResponse =
        await getTransactions(token);

      if (transactionResponse.success) {

        setTransactions(
          transactionResponse.transactions || []
        );

      }

    } catch (error) {

      console.error(
        'Dashboard error:',
        error
      );

      Alert.alert(
        'Dashboard Error',
        error instanceof Error
          ? error.message
          : 'Unable to load dashboard data.'
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // LOAD BUDGETS
  // =====================================================

  const loadBudgets = async () => {

    if (!token) {

      setLoadingBudget(false);

      return;

    }

    try {

      setLoadingBudget(true);

      const response =
        await getBudgets(token);

      if (response.success) {

        setBudgets(
          response.budgets || []
        );

      } else {

        setBudgets([]);

      }

    } catch (error) {

      console.error(
        'Budget loading error:',
        error
      );

      setBudgets([]);

    } finally {

      setLoadingBudget(false);

    }

  };


  // =====================================================
  // LOAD EVERYTHING
  // =====================================================

  const loadAllData = async () => {

    await Promise.all([
      loadDashboard(),
      loadBudgets(),
    ]);

  };


  useEffect(() => {

    loadAllData();

  }, [token]);


  useFocusEffect(
    useCallback(() => {

      if (token) {
        loadAllData();
      }

    }, [token])
  );


  // =====================================================
  // CURRENT DATE
  // =====================================================

  const currentDate = new Date();

  const currentMonth =
    currentDate.getMonth() + 1;

  const currentYear =
    currentDate.getFullYear();


  // =====================================================
  // CURRENT BUDGET
  // =====================================================

  const currentBudget =
    budgets.find(budget => {

      const budgetMonth =
        normalizeBudgetMonth(
          budget.month
        );

      const budgetYear =
        Number(budget.year);

      return (
        budgetMonth === currentMonth &&
        budgetYear === currentYear
      );

    });


  // =====================================================
  // CURRENT MONTH SPENDING
  // =====================================================

  const currentMonthSpent =
    transactions.reduce(
      (total, transaction) => {

        if (
          transaction.type !== 'Expense' ||
          !transaction.transaction_date
        ) {
          return total;
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
          return total;
        }

        const month =
          transactionDate.getMonth() + 1;

        const year =
          transactionDate.getFullYear();

        if (
          month === currentMonth &&
          year === currentYear
        ) {

          return (
            total +
            Number(transaction.amount || 0)
          );

        }

        return total;

      },
      0
    );


  const budgetAmount =
    currentBudget
      ? Number(
          currentBudget.budget_amount
        ) || 0
      : 0;


  const budgetPercentage =
    budgetAmount > 0
      ? (
          currentMonthSpent /
          budgetAmount
        ) * 100
      : 0;


  const safeProgressPercentage =
    Math.min(
      Math.max(
        budgetPercentage,
        0
      ),
      100
    );


  const budgetRemaining =
    budgetAmount -
    currentMonthSpent;


  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (
    amount: number
  ) => {

    return Number(
      amount || 0
    ).toLocaleString('en-KE');

  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Logout',
          style: 'destructive',

          onPress: async () => {

            try {

              await logout();

              // =============================================
              // NEW: DIRECTLY REDIRECT TO LOGIN AFTER LOGOUT
              // =============================================
              router.replace('/login');

            } catch (error) {

              Alert.alert(
                'Error',
                'Unable to logout. Please try again.'
              );

            }

          },
        },
      ]
    );

  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <SafeAreaView
        style={[
          styles.loadingContainer,
          darkMode && styles.darkContainer,
        ]}
      >

        <View style={styles.loadingCircle}>

          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

        </View>

        <Text
          style={[
            styles.loadingText,
            darkMode && styles.darkSecondaryText,
          ]}
        >
          Loading your finances...
        </Text>

      </SafeAreaView>

    );

  }


  // =====================================================
  // USER INITIAL
  // =====================================================

  const userInitial =
    user?.full_name
      ? user.full_name
          .charAt(0)
          .toUpperCase()
      : 'S';


  // =====================================================
  // DASHBOARD
  // =====================================================

  return (

    <SafeAreaView
      style={[
        styles.container,
        darkMode && styles.darkContainer,
      ]}
    >

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>

          <View style={styles.headerText}>

            <Text
              style={[
                styles.greeting,
                darkMode && styles.darkSecondaryText,
              ]}
            >
              Welcome back
            </Text>

            <Text
              style={[
                styles.name,
                darkMode && styles.darkPrimaryText,
              ]}
              numberOfLines={1}
            >
              {user?.full_name || 'Student'}
            </Text>

          </View>


          <View style={styles.headerRight}>

            <Pressable
              style={styles.profileCircle}
              onPress={() =>
                router.push('/profile')
              }
            >

              <Text style={styles.profileText}>
                {userInitial}
              </Text>

            </Pressable>

            {/* =============================================
                LOGOUT BUTTON
            ============================================= */}
            <Pressable
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed,
              ]}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>
                Logout
              </Text>
            </Pressable>

          </View>

        </View>


        {/* =================================================
            BALANCE CARD
        ================================================= */}

        <View style={styles.balanceCard}>

          <View style={styles.balanceHeader}>

            <View>

              <Text style={styles.balanceLabel}>
                Total Balance
              </Text>

              <Text style={styles.balance}>
                KSh {formatCurrency(summary.balance)}
              </Text>

            </View>

            <View style={styles.balanceIcon}>

              <Text style={styles.balanceIconText}>
                KSh
              </Text>

            </View>

          </View>


          <View style={styles.balanceDivider} />


          <View style={styles.balanceStats}>

            <View style={styles.balanceStat}>

              <View style={styles.incomeDot} />

              <View>

                <Text style={styles.smallLabel}>
                  Income
                </Text>

                <Text style={styles.income}>
                  KSh {formatCurrency(summary.totalIncome)}
                </Text>

              </View>

            </View>


            <View style={styles.balanceStat}>

              <View style={styles.expenseDot} />

              <View>

                <Text style={styles.smallLabel}>
                  Expenses
                </Text>

                <Text style={styles.expense}>
                  KSh {formatCurrency(summary.totalExpense)}
                </Text>

              </View>

            </View>

          </View>

        </View>


        {/* =================================================
            OVERVIEW
        ================================================= */}

        <View style={styles.overviewCard}>

          <View>

            <Text
              style={[
                styles.overviewLabel,
                darkMode && styles.darkSecondaryText,
              ]}
            >
              Total Transactions
            </Text>

            <Text
              style={[
                styles.overviewValue,
                darkMode && styles.darkPrimaryText,
              ]}
            >
              {summary.totalTransactions}
            </Text>

          </View>


          <View style={styles.overviewIcon}>

            <Text style={styles.overviewIconText}>
              ↗
            </Text>

          </View>

        </View>


        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <Text
          style={[
            styles.sectionTitle,
            darkMode && styles.darkPrimaryText,
          ]}
        >
          Quick Actions
        </Text>


        <View style={styles.actionsRow}>

          <Pressable
            style={[
              styles.actionCard,
              darkMode && styles.darkCard,
            ]}
            onPress={() =>
              router.push('/add-transaction')
            }
          >

            <View style={styles.incomeActionIcon}>

              <Text style={styles.actionIconText}>
                +
              </Text>

            </View>

            <Text
              style={[
                styles.actionText,
                darkMode && styles.darkPrimaryText,
              ]}
            >
              Add Income
            </Text>

            <Text
              style={[
                styles.actionSubText,
                darkMode && styles.darkSecondaryText,
              ]}
            >
              Record money received
            </Text>

          </Pressable>


          <Pressable
            style={[
              styles.actionCard,
              darkMode && styles.darkCard,
            ]}
            onPress={() =>
              router.push('/add-transaction')
            }
          >

            <View style={styles.expenseActionIcon}>

              <Text style={styles.actionIconText}>
                −
              </Text>

            </View>

            <Text
              style={[
                styles.actionText,
                darkMode && styles.darkPrimaryText,
              ]}
            >
              Add Expense
            </Text>

            <Text
              style={[
                styles.actionSubText,
                darkMode && styles.darkSecondaryText,
              ]}
            >
              Record money spent
            </Text>

          </Pressable>

        </View>


        {/* =================================================
            MONTHLY BUDGET
        ================================================= */}

        <View style={styles.sectionHeader}>

          <Text
            style={[
              styles.sectionTitle,
              darkMode && styles.darkPrimaryText,
            ]}
          >
            Monthly Budget
          </Text>

          <Pressable
            onPress={() =>
              router.push('/budget')
            }
          >

            <Text style={styles.viewText}>
              View All
            </Text>

          </Pressable>

        </View>


        <View
          style={[
            styles.budgetCard,
            darkMode && styles.darkCard,
          ]}
        >

          {loadingBudget ? (

            <View style={styles.budgetLoading}>

              <ActivityIndicator
                size="small"
                color="#2563EB"
              />

              <Text
                style={[
                  styles.budgetLoadingText,
                  darkMode &&
                    styles.darkSecondaryText,
                ]}
              >
                Loading budget...
              </Text>

            </View>

          ) : currentBudget ? (

            <>

              <View style={styles.budgetTop}>

                <View style={styles.budgetTitleContainer}>

                  <Text
                    style={[
                      styles.budgetTitle,
                      darkMode &&
                        styles.darkPrimaryText,
                    ]}
                  >
                    {getMonthName(
                      currentBudget.month
                    )} Budget
                  </Text>

                  <Text
                    style={[
                      styles.budgetSpentText,
                      darkMode &&
                        styles.darkSecondaryText,
                    ]}
                  >
                    KSh {formatCurrency(
                      currentMonthSpent
                    )} spent
                  </Text>

                </View>

                <Text
                  style={[
                    styles.budgetAmount,
                    darkMode &&
                      styles.darkPrimaryText,
                  ]}
                >
                  KSh {formatCurrency(
                    budgetAmount
                  )}
                </Text>

              </View>


              <View style={styles.progressBackground}>

                <View
                  style={[
                    styles.progress,
                    {
                      width:
                        `${safeProgressPercentage}%`,

                      backgroundColor:
                        budgetPercentage > 100
                          ? '#EF4444'
                          : budgetPercentage >= 80
                          ? '#F59E0B'
                          : '#2563EB',
                    },
                  ]}
                />

              </View>


              <View style={styles.progressInfo}>

                <Text
                  style={[
                    styles.progressPercentage,
                    darkMode &&
                      styles.darkSecondaryText,
                  ]}
                >
                  {Math.round(
                    budgetPercentage
                  )}% used
                </Text>

                <Text
                  style={
                    budgetRemaining >= 0
                      ? styles.remaining
                      : styles.overBudget
                  }
                >
                  {budgetRemaining >= 0
                    ? `KSh ${formatCurrency(
                        budgetRemaining
                      )} remaining`
                    : `KSh ${formatCurrency(
                        Math.abs(
                          budgetRemaining
                        )
                      )} over budget`}
                </Text>

              </View>

            </>

          ) : (

            <View style={styles.noBudgetContainer}>

              <Text
                style={[
                  styles.noBudgetTitle,
                  darkMode &&
                    styles.darkPrimaryText,
                ]}
              >
                No monthly budget
              </Text>

              <Text
                style={[
                  styles.noBudgetText,
                  darkMode &&
                    styles.darkSecondaryText,
                ]}
              >
                Create a budget to monitor your
                spending this month.
              </Text>

              <Pressable
                style={styles.setBudgetButton}
                onPress={() =>
                  router.push('/budget')
                }
              >

                <Text style={styles.setBudgetButtonText}>
                  Create Budget
                </Text>

              </Pressable>

            </View>

          )}

        </View>


        {/* =================================================
            REPORTS
        ================================================= */}

        <View style={styles.sectionHeader}>

          <Text
            style={[
              styles.sectionTitle,
              darkMode && styles.darkPrimaryText,
            ]}
          >
            Financial Reports
          </Text>

          <Pressable
            onPress={() =>
              router.push('/reports')
            }
          >

            <Text style={styles.viewText}>
              View Reports
            </Text>

          </Pressable>

        </View>


        <Pressable
          style={[
            styles.reportsCard,
            darkMode && styles.darkCard,
          ]}
          onPress={() =>
            router.push('/reports')
          }
        >

          <View style={styles.reportsIconContainer}>

            <Text style={styles.reportsIcon}>
              ↗
            </Text>

          </View>

          <View style={styles.reportsContent}>

            <Text
              style={[
                styles.reportsTitle,
                darkMode &&
                  styles.darkPrimaryText,
              ]}
            >
              Financial Overview
            </Text>

            <Text
              style={[
                styles.reportsDescription,
                darkMode &&
                  styles.darkSecondaryText,
              ]}
            >
              Analyse your income, expenses
              and spending patterns.
            </Text>

          </View>

          <Text style={styles.reportsArrow}>
            →
          </Text>

        </Pressable>


        {/* =================================================
            RECENT TRANSACTIONS
        ================================================= */}

        <View style={styles.sectionHeader}>

          <Text
            style={[
              styles.sectionTitle,
              darkMode && styles.darkPrimaryText,
            ]}
          >
            Recent Transactions
          </Text>

          <Pressable
            onPress={() =>
              router.push('/transactions')
            }
          >

            <Text style={styles.viewText}>
              See All
            </Text>

          </Pressable>

        </View>


        <View
          style={[
            styles.transactionCard,
            darkMode && styles.darkCard,
          ]}
        >

          {transactions.length === 0 ? (

            <View style={styles.emptyTransactions}>

              <View style={styles.emptyIconContainer}>

                <Text style={styles.emptyIcon}>
                  +
                </Text>

              </View>

              <Text
                style={[
                  styles.emptyTitle,
                  darkMode &&
                    styles.darkPrimaryText,
                ]}
              >
                No transactions yet
              </Text>

              <Text
                style={[
                  styles.emptyText,
                  darkMode &&
                    styles.darkSecondaryText,
                ]}
              >
                Add your first income or expense
                to start tracking your finances.
              </Text>

            </View>

          ) : (

            transactions
              .slice(0, 5)
              .map(transaction => (

                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  darkMode={darkMode}
                />

              ))

          )}

        </View>

      </ScrollView>

    </SafeAreaView>

  );

}


// =====================================================
// TRANSACTION ITEM
// =====================================================

function TransactionItem({
  transaction,
  darkMode,
}: {
  transaction: Transaction;
  darkMode: boolean;
}) {

  const isExpense =
    transaction.type === 'Expense';

  const amount =
    Number(transaction.amount) || 0;

  const icon =
    getTransactionIcon(
      transaction.category_name,
      transaction.type
    );

  const formattedDate =
    formatTransactionDate(
      transaction.transaction_date
    );


  return (

    <View
      style={[
        styles.transaction,
        darkMode && styles.darkBorder,
      ]}
    >

      <View style={styles.transactionLeft}>

        <View
          style={[
            styles.transactionIcon,
            isExpense
              ? styles.expenseIconBackground
              : styles.incomeIconBackground,
          ]}
        >

          <Text style={styles.transactionEmoji}>
            {icon}
          </Text>

        </View>


        <View style={styles.transactionDetails}>

          <Text
            style={[
              styles.transactionTitle,
              darkMode &&
                styles.darkPrimaryText,
            ]}
            numberOfLines={1}
          >
            {transaction.category_name ||
              'Transaction'}
          </Text>

          <Text
            style={[
              styles.transactionDate,
              darkMode &&
                styles.darkSecondaryText,
            ]}
            numberOfLines={1}
          >
            {transaction.description ||
              formattedDate}
          </Text>

        </View>

      </View>


      <View style={styles.transactionAmountContainer}>

        <Text
          style={[
            styles.transactionAmount,
            isExpense
              ? styles.expenseAmount
              : styles.incomeAmount,
          ]}
        >
          {isExpense ? '- ' : '+ '}
          KSh {amount.toLocaleString()}
        </Text>

        <Text
          style={[
            styles.transactionDateSmall,
            darkMode &&
              styles.darkSecondaryText,
          ]}
        >
          {formattedDate}
        </Text>

      </View>

    </View>

  );

}


// =====================================================
// DATE FORMAT
// =====================================================

function formatTransactionDate(
  dateString: string
): string {

  if (!dateString) {
    return '';
  }

  const date =
    new Date(dateString);

  if (isNaN(date.getTime())) {
    return dateString;
  }

  const today =
    new Date();

  const yesterday =
    new Date();

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  if (
    date.toDateString() ===
    today.toDateString()
  ) {

    return `Today, ${date.toLocaleTimeString(
      [],
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    )}`;

  }

  if (
    date.toDateString() ===
    yesterday.toDateString()
  ) {

    return 'Yesterday';

  }

  return date.toLocaleDateString(
    [],
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );

}


// =====================================================
// TRANSACTION ICON
// =====================================================

function getTransactionIcon(
  categoryName?: string,
  type?: 'Income' | 'Expense'
): string {

  const category =
    categoryName
      ?.toLowerCase()
      .trim() || '';


  if (type === 'Income') {

    if (
      category.includes('salary') ||
      category.includes('wage')
    ) return '💵';

    if (
      category.includes('scholarship') ||
      category.includes('bursary')
    ) return '🎓';

    if (
      category.includes('business') ||
      category.includes('profit')
    ) return '💼';

    if (category.includes('gift'))
      return '🎁';

    if (category.includes('freelance'))
      return '💻';

    if (category.includes('refund'))
      return '↩️';

    return '💰';

  }


  if (
    category.includes('food') ||
    category.includes('restaurant') ||
    category.includes('meal') ||
    category.includes('groceries')
  ) return '🍔';

  if (
    category.includes('transport') ||
    category.includes('bus') ||
    category.includes('taxi') ||
    category.includes('fuel') ||
    category.includes('fare')
  ) return '🚌';

  if (
    category.includes('book') ||
    category.includes('books')
  ) return '📚';

  if (
    category.includes('school') ||
    category.includes('education') ||
    category.includes('tuition')
  ) return '🎓';

  if (
    category.includes('rent') ||
    category.includes('house') ||
    category.includes('housing')
  ) return '🏠';

  if (
    category.includes('shopping') ||
    category.includes('clothes') ||
    category.includes('clothing')
  ) return '🛍️';

  if (
    category.includes('phone') ||
    category.includes('airtime') ||
    category.includes('mobile')
  ) return '📱';

  if (
    category.includes('internet') ||
    category.includes('wifi') ||
    category.includes('data')
  ) return '🌐';

  if (
    category.includes('medical') ||
    category.includes('medicine') ||
    category.includes('hospital') ||
    category.includes('doctor') ||
    category.includes('clinic')
  ) return '🏥';

  if (
    category.includes('health') ||
    category.includes('fitness') ||
    category.includes('gym')
  ) return '❤️';

  if (
    category.includes('entertainment') ||
    category.includes('movie') ||
    category.includes('cinema') ||
    category.includes('game') ||
    category.includes('gaming')
  ) return '🎮';

  if (
    category.includes('electricity') ||
    category.includes('electric')
  ) return '💡';

  if (category.includes('water'))
    return '💧';

  if (category.includes('security'))
    return '🔒';

  if (category.includes('insurance'))
    return '🛡️';

  if (
    category.includes('travel') ||
    category.includes('holiday')
  ) return '✈️';

  if (
    category.includes('subscription') ||
    category.includes('netflix') ||
    category.includes('spotify')
  ) return '📺';

  return '💳';

}


// =====================================================
// STYLES
// =====================================================

const styles =
  StyleSheet.create({

  // ---------------------------------------------------
  // MAIN
  // ---------------------------------------------------

  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  darkContainer: {
    backgroundColor: '#0F172A',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 50,
  },


  // ---------------------------------------------------
  // DARK MODE
  // ---------------------------------------------------

  darkCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },

  darkPrimaryText: {
    color: '#F8FAFC',
  },

  darkSecondaryText: {
    color: '#94A3B8',
  },

  darkBorder: {
    borderBottomColor: '#334155',
  },


  // ---------------------------------------------------
  // LOADING
  // ---------------------------------------------------

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
  },

  loadingCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },


  // ---------------------------------------------------
  // HEADER
  // ---------------------------------------------------

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },

  headerText: {
    flex: 1,
    paddingRight: 15,
  },

  greeting: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },

  name: {
    fontSize: 25,
    fontWeight: '800',
    color: '#0F172A',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  profileText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },


  // ---------------------------------------------------
  // LOGOUT BUTTON
  // ---------------------------------------------------

  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    minWidth: 80, // Increased minWidth so it's a bigger tap target
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  logoutButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },


  // ---------------------------------------------------
  // BALANCE CARD
  // ---------------------------------------------------

  balanceCard: {
    backgroundColor: '#2563EB',
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
  },

  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  balanceLabel: {
    color: '#BFDBFE',
    fontSize: 13,
    fontWeight: '600',
  },

  balance: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '800',
    marginTop: 7,
  },

  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  balanceIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.20)',
    marginVertical: 20,
  },

  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  balanceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  incomeDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#86EFAC',
    marginRight: 9,
  },

  expenseDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FCA5A5',
    marginRight: 9,
  },

  smallLabel: {
    color: '#BFDBFE',
    fontSize: 11,
    marginBottom: 3,
  },

  income: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  expense: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },


  // ---------------------------------------------------
  // OVERVIEW
  // ---------------------------------------------------

  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  overviewLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },

  overviewValue: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },

  overviewIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  overviewIconText: {
    color: '#2563EB',
    fontSize: 22,
    fontWeight: '700',
  },


  // ---------------------------------------------------
  // SECTIONS
  // ---------------------------------------------------

  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  viewText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },


  // ---------------------------------------------------
  // QUICK ACTIONS
  // ---------------------------------------------------

  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
    marginTop: 13,
  },

  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  incomeActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  expenseActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionIconText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#2563EB',
  },

  actionText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 13,
  },

  actionSubText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },


  // ---------------------------------------------------
  // BUDGET
  // ---------------------------------------------------

  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  budgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  budgetTitleContainer: {
    flex: 1,
    marginRight: 10,
  },

  budgetTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },

  budgetSpentText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 5,
  },

  budgetAmount: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },

  progressBackground: {
    width: '100%',
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },

  progress: {
    height: 10,
    borderRadius: 5,
  },

  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 11,
  },

  progressPercentage: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },

  remaining: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '800',
  },

  overBudget: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },

  budgetLoading: {
    minHeight: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },

  budgetLoadingText: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 12,
  },

  noBudgetContainer: {
    paddingVertical: 5,
  },

  noBudgetTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },

  noBudgetText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },

  setBudgetButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 13,
  },

  setBudgetButtonText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },


  // ---------------------------------------------------
  // REPORTS
  // ---------------------------------------------------

  reportsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },

  reportsIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  reportsIcon: {
    color: '#2563EB',
    fontSize: 22,
    fontWeight: '800',
  },

  reportsContent: {
    flex: 1,
  },

  reportsTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },

  reportsDescription: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },

  reportsArrow: {
    color: '#2563EB',
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 8,
  },


  // ---------------------------------------------------
  // TRANSACTIONS
  // ---------------------------------------------------

  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  transaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },

  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  incomeIconBackground: {
    backgroundColor: '#ECFDF5',
  },

  expenseIconBackground: {
    backgroundColor: '#FEF2F2',
  },

  transactionEmoji: {
    fontSize: 19,
  },

  transactionDetails: {
    flex: 1,
  },

  transactionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },

  transactionDate: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },

  transactionAmountContainer: {
    alignItems: 'flex-end',
    maxWidth: 130,
  },

  transactionAmount: {
    fontSize: 12,
    fontWeight: '800',
  },

  transactionDateSmall: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 3,
  },

  expenseAmount: {
    color: '#DC2626',
  },

  incomeAmount: {
    color: '#16A34A',
  },


  // ---------------------------------------------------
  // EMPTY TRANSACTIONS
  // ---------------------------------------------------

  emptyTransactions: {
    paddingVertical: 35,
    alignItems: 'center',
  },

  emptyIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  emptyIcon: {
    color: '#2563EB',
    fontSize: 28,
    fontWeight: '800',
  },

  emptyTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },

  emptyText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 270,
    lineHeight: 18,
  },

});