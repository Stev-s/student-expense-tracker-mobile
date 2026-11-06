
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

const C = {
  navy: '#142B4A',
  navyLight: '#203D60',
  green: '#16A085',
  greenLight: '#E6F5F0',
  coral: '#E76F51',
  coralLight: '#FCEDE8',
  blue: '#5277E8',
  blueLight: '#EAF0FF',
  orange: '#E9A23B',
  orangeLight: '#FFF4E2',
  background: '#F4F6FA',
  white: '#FFFFFF',
  text: '#17243A',
  muted: '#8994A7',
  border: '#E9EDF3',
  darkBackground: '#101827',
  darkCard: '#1B2739',
  darkText: '#F4F6FB',
  darkMuted: '#A0AEC0',
  darkBorder: '#2B394E',
};

const monthNames = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

export default function HomeScreen() {
  const { user, token, logout } = useAuth();

  const [darkMode, setDarkMode] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    totalTransactions: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBudget, setLoadingBudget] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  const animateScreen = () => {
    fade.setValue(0);
    slide.setValue(20);

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        friction: 8,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadDarkMode = async () => {
    try {
      const saved = await AsyncStorage.getItem('darkMode');
      setDarkMode(saved === 'true');
    } catch (error) {
      console.error('Unable to load appearance setting:', error);
    }
  };

  const loadDashboard = async (isRefresh = false) => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (!hasLoadedOnce.current) {
      setLoading(true);
    }

    if (isRefresh) setRefreshing(true);

    try {
      const [dashboardResponse, transactionResponse] = await Promise.all([
        getDashboardSummary(token),
        getTransactions(token),
      ]);

      if (dashboardResponse.success) {
        setSummary(dashboardResponse.summary);
      }

      if (transactionResponse.success) {
        setTransactions(transactionResponse.transactions || []);
      }
    } catch (error) {
      console.error('Dashboard loading error:', error);

      if (!hasLoadedOnce.current) {
        Alert.alert(
          'Dashboard Error',
          error instanceof Error
            ? error.message
            : 'Unable to load your financial information.',
        );
      }
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadBudgets = async () => {
    if (!token) {
      setLoadingBudget(false);
      return;
    }

    try {
      const response = await getBudgets(token);

      if (response.success) {
        setBudgets(response.budgets || []);
      }
    } catch (error) {
      console.error('Budget loading error:', error);
    } finally {
      setLoadingBudget(false);
    }
  };

  useEffect(() => {
    loadDarkMode();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDarkMode();
      animateScreen();

      if (token) {
        loadDashboard();
        loadBudgets();
      } else {
        setLoading(false);
        setLoadingBudget(false);
      }

      return undefined;
    }, [token]),
  );

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const currentBudget = budgets.find((budget) => {
    const month = typeof budget.month === 'number'
      ? budget.month
      : Number(budget.month) ||
        monthNames.findIndex(
          (name) => name.toLowerCase() === String(budget.month).toLowerCase(),
        ) + 1;

    return month === currentMonth && Number(budget.year) === currentYear;
  });

  const currentMonthSpent = transactions.reduce((total, transaction) => {
    if (
      transaction.type !== 'Expense' ||
      !transaction.transaction_date
    ) {
      return total;
    }

    const date = new Date(transaction.transaction_date);

    if (
      Number.isNaN(date.getTime()) ||
      date.getMonth() + 1 !== currentMonth ||
      date.getFullYear() !== currentYear
    ) {
      return total;
    }

    return total + (Number(transaction.amount) || 0);
  }, 0);

  const budgetAmount = currentBudget
    ? Number(currentBudget.budget_amount) || 0
    : 0;

  const budgetPercentage = budgetAmount > 0
    ? (currentMonthSpent / budgetAmount) * 100
    : 0;

  const progress = Math.min(Math.max(budgetPercentage, 0), 100);
  const remaining = budgetAmount - currentMonthSpent;

  const formatMoney = (amount: number) =>
    `KSh ${Number(amount || 0).toLocaleString('en-KE', {
      maximumFractionDigits: 2,
    })}`;

  const firstName = user?.full_name
    ? user.full_name.trim().split(' ')[0]
    : 'Student';

  const initial = user?.full_name
    ? user.full_name.trim().charAt(0).toUpperCase()
    : 'S';

  const background = darkMode ? C.darkBackground : C.background;
  const card = darkMode ? C.darkCard : C.white;
  const text = darkMode ? C.darkText : C.text;
  const muted = darkMode ? C.darkMuted : C.muted;
  const border = darkMode ? C.darkBorder : C.border;

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      logout();
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.href = '/login';
      return;
    }

    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/login');
          } catch {
            Alert.alert('Error', 'Unable to logout. Please try again.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.loadingScreen, { backgroundColor: background }]}
      >
        <View style={styles.loadingLogo}>
          <MaterialCommunityIcons
            name="wallet-outline"
            size={34}
            color="#FFFFFF"
          />
        </View>
        <ActivityIndicator size="large" color={C.green} />
        <Text style={[styles.loadingText, { color: muted }]}>
          Preparing your financial dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: background }]}
      edges={['top']}
    >
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={darkMode ? C.darkBackground : C.background}
      />

      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: fade,
            transform: [{ translateY: slide }],
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* TOP HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.eyebrow, { color: muted }]}>
                STUDENT EXPENSE TRACKER
              </Text>
              <Text style={[styles.greeting, { color: text }]}>
                Hello, {firstName}!
              </Text>
              <Text style={[styles.welcomeText, { color: muted }]}>
                Let's keep your finances on track.
              </Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                style={[
                  styles.headerIconButton,
                  { backgroundColor: card, borderColor: border },
                ]}
                onPress={() => router.push('/settings')}
              >
                <MaterialCommunityIcons
                  name="cog-outline"
                  size={22}
                  color={text}
                />
              </Pressable>

              <Pressable
                style={styles.avatar}
                onPress={() => router.push('/profile')}
              >
                <Text style={styles.avatarText}>{initial}</Text>
              </Pressable>
            </View>
          </View>

          {/* MAIN BALANCE CARD */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceDecorOne} />
            <View style={styles.balanceDecorTwo} />

            <View style={styles.balanceTop}>
              <View>
                <View style={styles.balanceLabelRow}>
                  <MaterialCommunityIcons
                    name="wallet-outline"
                    size={17}
                    color="#C8EDE2"
                  />
                  <Text style={styles.balanceLabel}>
                    TOTAL AVAILABLE BALANCE
                  </Text>
                </View>
                <Text style={styles.balanceAmount}>
                  {formatMoney(summary.balance)}
                </Text>
                <Text style={styles.balanceCaption}>
                  Your financial snapshot
                </Text>
              </View>

              <View style={styles.balanceBadge}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={25}
                  color="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.balanceDivider} />

            <View style={styles.balanceBottom}>
              <View style={styles.balanceMetric}>
                <View style={styles.metricIcon}>
                  <MaterialCommunityIcons
                    name="arrow-down-left"
                    size={19}
                    color="#B8F0D8"
                  />
                </View>
                <View style={styles.metricText}>
                  <Text style={styles.metricLabel}>Total income</Text>
                  <Text style={styles.metricAmount}>
                    {formatMoney(summary.totalIncome)}
                  </Text>
                </View>
              </View>

              <View style={styles.metricSeparator} />

              <View style={styles.balanceMetric}>
                <View style={styles.metricIcon}>
                  <MaterialCommunityIcons
                    name="arrow-up-right"
                    size={19}
                    color="#FFD0C4"
                  />
                </View>
                <View style={styles.metricText}>
                  <Text style={styles.metricLabel}>Total expenses</Text>
                  <Text style={styles.metricAmount}>
                    {formatMoney(summary.totalExpense)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.sectionHeading}>
            <View>
              <Text style={[styles.sectionTitle, { color: text }]}>
                Quick actions
              </Text>
              <Text style={[styles.sectionSubtitle, { color: muted }]}>
                What would you like to do?
              </Text>
            </View>
          </View>

          <View style={styles.quickActions}>
            <QuickAction
              title="Add income"
              subtitle="Record money in"
              icon="cash-plus"
              color={C.green}
              background={darkMode ? '#193C36' : C.greenLight}
              onPress={() => router.push('/add-transaction')}
              card={card}
              text={text}
              muted={muted}
              border={border}
            />
            <QuickAction
              title="Add expense"
              subtitle="Record money out"
              icon="cash-minus"
              color={C.coral}
              background={darkMode ? '#462C30' : C.coralLight}
              onPress={() => router.push('/add-transaction')}
              card={card}
              text={text}
              muted={muted}
              border={border}
            />
          </View>

          <View style={styles.quickActions}>
            <QuickAction
              title="My budget"
              subtitle="Manage spending"
              icon="chart-donut"
              color={C.blue}
              background={darkMode ? '#263451' : C.blueLight}
              onPress={() => router.push('/budget')}
              card={card}
              text={text}
              muted={muted}
              border={border}
            />
            <QuickAction
              title="Reports"
              subtitle="View insights"
              icon="chart-box-outline"
              color={C.orange}
              background={darkMode ? '#443725' : C.orangeLight}
              onPress={() => router.push('/reports')}
              card={card}
              text={text}
              muted={muted}
              border={border}
            />
          </View>

          {/* FINANCIAL OVERVIEW */}
          <View style={styles.sectionHeading}>
            <View>
              <Text style={[styles.sectionTitle, { color: text }]}>
                Financial overview
              </Text>
              <Text style={[styles.sectionSubtitle, { color: muted }]}>
                Your activity at a glance
              </Text>
            </View>
          </View>

          <View style={[styles.overviewCard, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.overviewIcon}>
              <MaterialCommunityIcons
                name="swap-horizontal"
                size={24}
                color={C.blue}
              />
            </View>
            <View style={styles.overviewInfo}>
              <Text style={[styles.overviewLabel, { color: muted }]}>
                Total transactions
              </Text>
              <Text style={[styles.overviewValue, { color: text }]}>
                {summary.totalTransactions}
              </Text>
            </View>
            <Pressable
              style={styles.overviewArrow}
              onPress={() => router.push('/transactions')}
            >
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color={C.blue}
              />
            </Pressable>
          </View>

          {/* MONTHLY BUDGET */}
          <View style={styles.sectionHeading}>
            <View>
              <Text style={[styles.sectionTitle, { color: text }]}>
                Monthly budget
              </Text>
              <Text style={[styles.sectionSubtitle, { color: muted }]}>
                {monthNames[currentMonth - 1]} {currentYear}
              </Text>
            </View>

            <Pressable onPress={() => router.push('/budget')}>
              <Text style={styles.sectionLink}>Manage budget</Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.budgetCard,
              { backgroundColor: card, borderColor: border },
            ]}
          >
            {loadingBudget ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator color={C.green} />
                <Text style={{ color: muted }}>Loading your budget...</Text>
              </View>
            ) : currentBudget ? (
              <>
                <View style={styles.budgetTop}>
                  <View>
                    <Text style={[styles.budgetSmallLabel, { color: muted }]}>
                      MONTHLY SPENDING LIMIT
                    </Text>
                    <Text style={[styles.budgetTotal, { color: text }]}>
                      {formatMoney(budgetAmount)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.budgetPercentBadge,
                      {
                        backgroundColor:
                          budgetPercentage > 100
                            ? C.coralLight
                            : budgetPercentage >= 80
                              ? C.orangeLight
                              : C.greenLight,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          budgetPercentage > 100
                            ? C.coral
                            : budgetPercentage >= 80
                              ? C.orange
                              : C.green,
                        fontWeight: '800',
                        fontSize: 13,
                      }}
                    >
                      {Math.round(budgetPercentage)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.budgetNumbers}>
                  <Text style={[styles.budgetSpent, { color: muted }]}>
                    {formatMoney(currentMonthSpent)} spent
                  </Text>
                  <Text style={[styles.budgetSpent, { color: muted }]}>
                    {formatMoney(Math.max(0, budgetAmount - currentMonthSpent))} remaining
                  </Text>
                </View>

                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: darkMode ? '#354157' : '#E9EDF3' },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${progress}%`,
                        backgroundColor:
                          budgetPercentage > 100
                            ? C.coral
                            : budgetPercentage >= 80
                              ? C.orange
                              : C.green,
                      },
                    ]}
                  />
                </View>

                <View style={styles.budgetFooter}>
                  <MaterialCommunityIcons
                    name={
                      budgetPercentage > 100
                        ? 'alert-circle-outline'
                        : budgetPercentage >= 80
                          ? 'alert-outline'
                          : 'check-circle-outline'
                    }
                    size={17}
                    color={
                      budgetPercentage > 100
                        ? C.coral
                        : budgetPercentage >= 80
                          ? C.orange
                          : C.green
                    }
                  />
                  <Text
                    style={[
                      styles.budgetMessage,
                      {
                        color:
                          budgetPercentage > 100
                            ? C.coral
                            : budgetPercentage >= 80
                              ? C.orange
                              : C.green,
                      },
                    ]}
                  >
                    {budgetPercentage > 100
                      ? `You are ${formatMoney(Math.abs(remaining))} over budget.`
                      : budgetPercentage >= 80
                        ? 'You are approaching your budget limit.'
                        : 'You are doing well. Keep managing your spending.'}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.noBudget}>
                <View style={styles.noBudgetIcon}>
                  <MaterialCommunityIcons
                    name="wallet-plus-outline"
                    size={28}
                    color={C.green}
                  />
                </View>
                <Text style={[styles.noBudgetTitle, { color: text }]}>
                  No monthly budget set
                </Text>
                <Text style={[styles.noBudgetDescription, { color: muted }]}>
                  Create a spending limit and take better control of your money.
                </Text>
                <Pressable
                  style={styles.createBudgetButton}
                  onPress={() => router.push('/budget')}
                >
                  <Text style={styles.createBudgetText}>Create my budget</Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={17}
                    color="#FFFFFF"
                  />
                </Pressable>
              </View>
            )}
          </View>

          {/* RECENT TRANSACTIONS */}
          <View style={styles.sectionHeading}>
            <View>
              <Text style={[styles.sectionTitle, { color: text }]}>
                Recent transactions
              </Text>
              <Text style={[styles.sectionSubtitle, { color: muted }]}>
                Your latest money activities
              </Text>
            </View>

            <Pressable onPress={() => router.push('/transactions')}>
              <Text style={styles.sectionLink}>View all</Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.transactionsCard,
              { backgroundColor: card, borderColor: border },
            ]}
          >
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <MaterialCommunityIcons
                    name="receipt-text-outline"
                    size={30}
                    color={C.blue}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: text }]}>
                  No transactions yet
                </Text>
                <Text style={[styles.emptyDescription, { color: muted }]}>
                  Your financial activities will appear here once you add your first transaction.
                </Text>
                <Pressable
                  style={styles.emptyButton}
                  onPress={() => router.push('/add-transaction')}
                >
                  <Text style={styles.emptyButtonText}>Add transaction</Text>
                </Pressable>
              </View>
            ) : (
              transactions.slice(0, 5).map((transaction, index) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  darkMode={darkMode}
                  isLast={index === Math.min(transactions.length, 5) - 1}
                />
              ))
            )}
          </View>

          {/* REPORTS PROMO */}
          <Pressable
            style={({ pressed }) => [
              styles.insightCard,
              { opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() => router.push('/reports')}
          >
            <View style={styles.insightIcon}>
              <MaterialCommunityIcons
                name="chart-areaspline"
                size={27}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Understand your money</Text>
              <Text style={styles.insightSubtitle}>
                Explore your financial reports and spending patterns.
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={25}
              color="#FFFFFF"
            />
          </Pressable>

          {/* FOOTER */}
          <View style={styles.footer}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={17}
              color={muted}
            />
            <Text style={[styles.footerText, { color: muted }]}>
              Student Expense Tracker · Stay financially smart.
            </Text>
          </View>

          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons
              name="logout"
              size={17}
              color={C.coral}
            />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>

      {refreshing && (
        <View style={styles.refreshIndicator}>
          <ActivityIndicator size="small" color={C.green} />
        </View>
      )}
    </SafeAreaView>
  );
}

// QUICK ACTION COMPONENT
function QuickAction({
  title,
  subtitle,
  icon,
  color,
  background,
  onPress,
  card,
  text,
  muted,
  border,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  background: string;
  onPress: () => void;
  card: string;
  text: string;
  muted: string;
  border: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickActionCard,
        {
          backgroundColor: card,
          borderColor: border,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: background }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.quickActionTitle, { color: text }]}>{title}</Text>
      <Text style={[styles.quickActionSubtitle, { color: muted }]}>
        {subtitle}
      </Text>
      <MaterialCommunityIcons
        name="arrow-up-right"
        size={17}
        color={muted}
        style={styles.quickActionArrow}
      />
    </Pressable>
  );
}

// TRANSACTION COMPONENT
function TransactionRow({
  transaction,
  darkMode,
  isLast,
}: {
  transaction: Transaction;
  darkMode: boolean;
  isLast: boolean;
}) {
  const isExpense = transaction.type === 'Expense';
  const amount = Number(transaction.amount) || 0;
  const icon = getTransactionIcon(
    transaction.category_name,
    transaction.type,
  );

  const date = formatTransactionDate(transaction.transaction_date);

  return (
    <View
      style={[
        styles.transactionRow,
        {
          borderBottomColor: darkMode ? C.darkBorder : C.border,
          borderBottomWidth: isLast ? 0 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.transactionIcon,
          {
            backgroundColor: isExpense
              ? darkMode ? '#462C30' : C.coralLight
              : darkMode ? '#193C36' : C.greenLight,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={isExpense ? C.coral : C.green}
        />
      </View>

      <View style={styles.transactionDetails}>
        <Text
          style={[
            styles.transactionName,
            { color: darkMode ? C.darkText : C.text },
          ]}
          numberOfLines={1}
        >
          {transaction.category_name || 'Transaction'}
        </Text>
        <Text
          style={[
            styles.transactionDescription,
            { color: darkMode ? C.darkMuted : C.muted },
          ]}
          numberOfLines={1}
        >
          {transaction.description || date}
        </Text>
      </View>

      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.transactionAmount,
            { color: isExpense ? C.coral : C.green },
          ]}
        >
          {isExpense ? '− ' : '+ '}
          {amount.toLocaleString('en-KE', {
            maximumFractionDigits: 2,
          })}
        </Text>
        <Text
          style={[
            styles.transactionDate,
            { color: darkMode ? C.darkMuted : C.muted },
          ]}
        >
          {date}
        </Text>
      </View>
    </View>
  );
}

// CATEGORY ICONS
function getTransactionIcon(
  categoryName?: string,
  type?: 'Income' | 'Expense',
): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  const category = categoryName?.toLowerCase().trim() || '';

  if (type === 'Income') {
    if (category.includes('salary') || category.includes('wage')) return 'cash';
    if (category.includes('scholarship') || category.includes('bursary')) return 'school';
    if (category.includes('business') || category.includes('profit')) return 'briefcase';
    if (category.includes('gift')) return 'gift';
    if (category.includes('freelance')) return 'laptop';
    if (category.includes('refund')) return 'cash-refund';
    return 'cash-plus';
  }

  if (
    category.includes('food') ||
    category.includes('restaurant') ||
    category.includes('meal') ||
    category.includes('groceries')
  ) return 'food';

  if (
    category.includes('transport') ||
    category.includes('bus') ||
    category.includes('taxi') ||
    category.includes('fuel')
  ) return 'bus';

  if (
    category.includes('rent') ||
    category.includes('house') ||
    category.includes('accommodation')
  ) return 'home';

  if (
    category.includes('school') ||
    category.includes('education') ||
    category.includes('book')
  ) return 'book-open-variant';

  if (category.includes('health') || category.includes('medical')) return 'hospital-box';
  if (category.includes('entertainment') || category.includes('movie')) return 'movie-open';
  if (category.includes('shopping') || category.includes('clothes')) return 'shopping';
  if (category.includes('airtime')) return 'cellphone';
  if (category.includes('internet')) return 'wifi';

  return 'receipt-text-outline';
}

// DATE FORMAT
function formatTransactionDate(dateString: string): string {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return dateString;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 35,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },
  loadingLogo: {
    width: 70,
    height: 70,
    borderRadius: 23,
    backgroundColor: C.navy,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  greeting: {
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  welcomeText: {
    fontSize: 12,
    marginTop: 5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    height: 43,
    width: 43,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatar: {
    height: 45,
    width: 45,
    borderRadius: 16,
    backgroundColor: C.green,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  // BALANCE CARD
  balanceCard: {
    backgroundColor: C.navy,
    borderRadius: 27,
    padding: 22,
    marginBottom: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: C.navy,
    shadowOpacity: 0.22,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  balanceDecorOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.045)',
    top: -100,
    right: -40,
  },
  balanceDecorTwo: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(22,160,133,0.15)',
    bottom: -85,
    right: 35,
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  balanceLabel: {
    color: '#C8EDE2',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  balanceCaption: {
    color: '#B8C8D9',
    fontSize: 11,
    marginTop: 6,
  },
  balanceBadge: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: 20,
  },
  balanceBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceMetric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricText: {
    flex: 1,
  },
  metricLabel: {
    color: '#B8C8D9',
    fontSize: 10,
    marginBottom: 5,
  },
  metricAmount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  metricSeparator: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 12,
  },

  // SECTION HEADINGS
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 4,
  },
  sectionLink: {
    color: C.green,
    fontSize: 11,
    fontWeight: '800',
  },

  // QUICK ACTIONS
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quickActionCard: {
    flex: 1,
    minHeight: 126,
    borderRadius: 19,
    padding: 14,
    borderWidth: 1,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.035,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  quickActionIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 10,
  },
  quickActionArrow: {
    position: 'absolute',
    top: 15,
    right: 13,
  },

  // OVERVIEW
  overviewCard: {
    borderRadius: 19,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 27,
  },
  overviewIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: C.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewInfo: {
    flex: 1,
    marginLeft: 13,
  },
  overviewLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 21,
    fontWeight: '900',
  },
  overviewArrow: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: C.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // BUDGET
  budgetCard: {
    borderRadius: 21,
    padding: 18,
    borderWidth: 1,
    marginBottom: 27,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.035,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  centerLoading: {
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  budgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 19,
  },
  budgetSmallLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  budgetTotal: {
    fontSize: 22,
    fontWeight: '900',
  },
  budgetPercentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
  budgetNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  budgetSpent: {
    fontSize: 10,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 11,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 10,
  },
  budgetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 16,
  },
  budgetMessage: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  noBudget: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  noBudgetIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    backgroundColor: C.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 13,
  },
  noBudgetTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 7,
  },
  noBudgetDescription: {
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 17,
  },
  createBudgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.green,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 13,
  },
  createBudgetText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // TRANSACTIONS
  transactionsCard: {
    borderRadius: 21,
    paddingHorizontal: 15,
    borderWidth: 1,
    marginBottom: 22,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.035,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  transactionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 11,
    marginRight: 5,
  },
  transactionName: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
  },
  transactionDescription: {
    fontSize: 10,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 5,
  },
  transactionDate: {
    fontSize: 9,
  },

  // EMPTY STATE
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 30,
  },
  emptyIcon: {
    width: 57,
    height: 57,
    borderRadius: 19,
    backgroundColor: C.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 13,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 7,
  },
  emptyDescription: {
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: C.navy,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // INSIGHT CARD
  insightCard: {
    backgroundColor: C.green,
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  insightIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
    marginRight: 5,
  },
  insightTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 5,
  },
  insightSubtitle: {
    color: '#E2F8F1',
    fontSize: 10,
    lineHeight: 15,
  },

  // FOOTER
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 15,
  },
  footerText: {
    fontSize: 10,
    textAlign: 'center',
  },
  logoutButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  logoutText: {
    color: C.coral,
    fontSize: 12,
    fontWeight: '800',
  },
  refreshIndicator: {
    position: 'absolute',
    top: 7,
    right: 20,
  },
});
