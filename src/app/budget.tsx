import React, {
  useCallback,
  useState,
} from "react";

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

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  router,
  useFocusEffect,
} from "expo-router";

import {
  useAuth,
} from "@/context/AuthContext";

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

  // ===================================================
  // AUTHENTICATION
  // ===================================================

  const { token } = useAuth();


  // ===================================================
  // THEME
  // ===================================================

  const { isDarkMode } = useTheme();

  const colors =
    isDarkMode
      ? darkColors
      : lightColors;


  // ===================================================
  // BUDGETS
  // ===================================================

  const [budgets, setBudgets] =
    useState<Budget[]>([]);


  // ===================================================
  // LOADING STATES
  // ===================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);


  // ===================================================
  // FORM
  // ===================================================

  const [month, setMonth] =
    useState("");

  const [year, setYear] =
    useState(
      String(
        new Date().getFullYear()
      )
    );

  const [amount, setAmount] =
    useState("");

  const [editingBudget, setEditingBudget] =
    useState<Budget | null>(null);


  // ===================================================
  // MONTHS
  // ===================================================

  const months = [
    {
      number: "1",
      name: "January",
    },
    {
      number: "2",
      name: "February",
    },
    {
      number: "3",
      name: "March",
    },
    {
      number: "4",
      name: "April",
    },
    {
      number: "5",
      name: "May",
    },
    {
      number: "6",
      name: "June",
    },
    {
      number: "7",
      name: "July",
    },
    {
      number: "8",
      name: "August",
    },
    {
      number: "9",
      name: "September",
    },
    {
      number: "10",
      name: "October",
    },
    {
      number: "11",
      name: "November",
    },
    {
      number: "12",
      name: "December",
    },
  ];


  // ===================================================
  // GET MONTH NAME
  // ===================================================

  const getMonthName = (
    monthNumber: number | string
  ) => {

    const monthObject =
      months.find(
        (item) =>
          Number(item.number) ===
          Number(monthNumber)
      );

    return monthObject
      ? monthObject.name
      : String(monthNumber);

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
        "Budget loading error:",
        error
      );


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

    if (!token) {

      return;

    }


    try {

      setRefreshing(true);


      const response =
        await getBudgets(token);


      if (response.success) {

        setBudgets(
          response.budgets || []
        );

      }


    } catch (error) {

      console.error(
        "Refresh budgets error:",
        error
      );


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

    setYear(
      String(
        new Date().getFullYear()
      )
    );

    setAmount("");

    setEditingBudget(null);

  };


  // ===================================================
  // START EDITING
  // ===================================================

  const handleEdit = (
    budget: Budget
  ) => {

    setEditingBudget(budget);


    setMonth(
      String(budget.month)
    );


    setYear(
      String(budget.year)
    );


    setAmount(
      String(budget.budget_amount)
    );

  };


  // ===================================================
  // SAVE BUDGET
  // ===================================================

  const handleSave = async () => {

    // =================================================
    // CHECK LOGIN
    // =================================================

    if (!token) {

      Alert.alert(
        "Error",
        "You are not logged in."
      );

      return;

    }


    // =================================================
    // VALIDATE MONTH
    // =================================================

    if (!month) {

      Alert.alert(
        "Missing month",
        "Please select the budget month."
      );

      return;

    }


    const numericMonth =
      Number(month);


    if (
      Number.isNaN(numericMonth) ||
      numericMonth < 1 ||
      numericMonth > 12
    ) {

      Alert.alert(
        "Invalid month",
        "Please select a valid month."
      );

      return;

    }


    // =================================================
    // VALIDATE YEAR
    // =================================================

    if (!year.trim()) {

      Alert.alert(
        "Missing year",
        "Please enter the budget year."
      );

      return;

    }


    const numericYear =
      Number(year);


    if (
      Number.isNaN(numericYear) ||
      numericYear < 2000 ||
      numericYear > 2100
    ) {

      Alert.alert(
        "Invalid year",
        "Please enter a valid year."
      );

      return;

    }


    // =================================================
    // VALIDATE AMOUNT
    // =================================================

    if (!amount.trim()) {

      Alert.alert(
        "Missing amount",
        "Please enter the budget amount."
      );

      return;

    }


    const numericAmount =
      Number(amount);


    if (
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {

      Alert.alert(
        "Invalid amount",
        "Budget amount must be greater than zero."
      );

      return;

    }


    // =================================================
    // SAVE
    // =================================================

    try {

      setSaving(true);


      const data = {

        month:
          numericMonth,

        year:
          numericYear,

        budget_amount:
          numericAmount,

      };


      // =================================================
      // UPDATE EXISTING BUDGET
      // =================================================

      if (editingBudget) {

        const response =
          await updateBudget(
            token,
            editingBudget.id,
            data
          );


        if (!response.success) {

          throw new Error(
            response.message ||
              "Unable to update budget."
          );

        }


        Alert.alert(
          "Success",
          "Budget updated successfully."
        );

      }


      // =================================================
      // CREATE NEW BUDGET
      // =================================================

      else {

        const response =
          await createBudget(
            token,
            data
          );


        if (!response.success) {

          throw new Error(
            response.message ||
              "Unable to create budget."
          );

        }


        Alert.alert(
          "Success",
          "Budget added successfully."
        );

      }


      // =================================================
      // RESET
      // =================================================

      resetForm();


      // =================================================
      // RELOAD
      // =================================================

      await loadBudgets();


    } catch (error) {

      console.error(
        "Save budget error:",
        error
      );


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

  const handleDelete = (
    budget: Budget
  ) => {

    Alert.alert(

      "Delete Budget",

      `Are you sure you want to delete the ${getMonthName(
        budget.month
      )} ${budget.year} budget?`,

      [

        {
          text: "Cancel",

          style: "cancel",

        },

        {

          text: "Delete",

          style: "destructive",

          onPress: async () => {

            if (!token) {

              return;

            }


            try {

              const response =
                await deleteBudget(
                  token,
                  budget.id
                );


              if (!response.success) {

                throw new Error(
                  response.message ||
                    "Unable to delete budget."
                );

              }


              Alert.alert(
                "Success",
                "Budget deleted successfully."
              );


              await loadBudgets();


            } catch (error) {

              console.error(
                "Delete budget error:",
                error
              );


              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Unable to delete budget."
              );

            }

          },

        },

      ]

    );

  };


  // ===================================================
  // FORMAT AMOUNT
  // ===================================================

  const formatAmount = (
    amount: number
  ) => {

    return Number(
      amount || 0
    ).toLocaleString(
      "en-KE"
    );

  };


  // ===================================================
  // TOTAL BUDGET
  // ===================================================

  const totalBudget =
    budgets.reduce(

      (total, budget) =>

        total +
        Number(
          budget.budget_amount || 0
        ),

      0

    );


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
          Loading budgets...
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

            refreshing={
              refreshing
            }

            onRefresh={
              refreshBudgets
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

            style={
              styles.backButtonContainer
            }

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
            Budgets
          </Text>


          <View
            style={
              styles.headerSpace
            }
          />

        </View>


        {/* =================================================
            TOTAL BUDGET
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

          <Text
            style={
              styles.summaryLabel
            }
          >
            Total Planned Budget
          </Text>


          <Text
            style={
              styles.summaryAmount
            }
          >
            KSh{" "}
            {formatAmount(
              totalBudget
            )}
          </Text>


          <Text
            style={
              styles.summaryCount
            }
          >

            {budgets.length} budget
            {budgets.length === 1
              ? ""
              : "s"}

          </Text>

        </View>


        {/* =================================================
            ADD / EDIT FORM
        ================================================= */}

        <View

          style={[
            styles.formCard,
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
              styles.formTitle,
              {
                color:
                  colors.text,
              },
            ]}

          >

            {editingBudget
              ? "Edit Budget"
              : "Add Budget"}

          </Text>


          {/* =================================================
              MONTH
          ================================================= */}

          <Text

            style={[
              styles.label,
              {
                color:
                  colors.text,
              },
            ]}

          >
            Month
          </Text>


          <View
            style={
              styles.monthContainer
            }
          >

            {months.map(
              (item) => (

                <Pressable

                  key={
                    item.number
                  }

                  style={[

                    styles.monthButton,

                    {
                      backgroundColor:
                        colors.card,

                      borderColor:
                        colors.border,
                    },

                    month ===
                      item.number &&
                      {
                        backgroundColor:
                          colors.primary,

                        borderColor:
                          colors.primary,
                      },

                  ]}

                  onPress={() =>
                    setMonth(
                      item.number
                    )
                  }

                >

                  <Text

                    style={[

                      styles.monthButtonText,

                      {
                        color:
                          colors.secondaryText,
                      },

                      month ===
                        item.number &&
                        {
                          color:
                            colors.white,
                        },

                    ]}

                  >

                    {item.name}

                  </Text>

                </Pressable>

              )
            )}

          </View>


          {/* =================================================
              YEAR
          ================================================= */}

          <Text

            style={[
              styles.label,
              {
                color:
                  colors.text,
              },
            ]}

          >
            Year
          </Text>


          <TextInput

            style={[

              styles.input,

              {
                backgroundColor:
                  colors.inputBackground,

                borderColor:
                  colors.border,

                color:
                  colors.text,
              },

            ]}

            placeholder="e.g. 2026"

            placeholderTextColor={
              colors.mutedText
            }

            value={
              year
            }

            onChangeText={
              setYear
            }

            keyboardType="number-pad"

          />


          {/* =================================================
              AMOUNT
          ================================================= */}

          <Text

            style={[
              styles.label,
              {
                color:
                  colors.text,
              },
            ]}

          >
            Budget Amount
          </Text>


          <TextInput

            style={[

              styles.input,

              {
                backgroundColor:
                  colors.inputBackground,

                borderColor:
                  colors.border,

                color:
                  colors.text,
              },

            ]}

            placeholder="Enter budget amount"

            placeholderTextColor={
              colors.mutedText
            }

            value={
              amount
            }

            onChangeText={
              setAmount
            }

            keyboardType="decimal-pad"

          />


          {/* =================================================
              SAVE
          ================================================= */}

          <Pressable

            style={[

              styles.saveButton,

              {
                backgroundColor:
                  colors.primary,
              },

              saving &&
                styles.disabledButton,

            ]}

            onPress={
              handleSave
            }

            disabled={
              saving
            }

          >

            <Text
              style={
                styles.saveButtonText
              }
            >

              {saving
                ? "Saving..."
                : editingBudget
                ? "Update Budget"
                : "Add Budget"}

            </Text>

          </Pressable>


          {/* =================================================
              CANCEL EDITING
          ================================================= */}

          {editingBudget && (

            <Pressable

              style={[
                styles.cancelButton,
                {
                  backgroundColor:
                    isDarkMode
                      ? colors.iconBackground
                      : "#F3F4F6",
                },
              ]}

              onPress={
                resetForm
              }

            >

              <Text

                style={[
                  styles.cancelButtonText,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}

              >
                Cancel Editing
              </Text>

            </Pressable>

          )}

        </View>


        {/* =================================================
            BUDGET LIST HEADER
        ================================================= */}

        <View
          style={
            styles.sectionHeader
          }
        >

          <Text

            style={[
              styles.sectionTitle,
              {
                color:
                  colors.text,
              },
            ]}

          >
            My Budgets
          </Text>


          <Text

            style={[
              styles.countText,
              {
                backgroundColor:
                  isDarkMode
                    ? "#1E3A8A"
                    : "#E8EEFF",

                color:
                  colors.primary,
              },
            ]}

          >
            {budgets.length}
          </Text>

        </View>


        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {budgets.length === 0 ? (

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

            <Text
              style={
                styles.emptyIcon
              }
            >
              💰
            </Text>


            <Text

              style={[
                styles.emptyTitle,
                {
                  color:
                    colors.text,
                },
              ]}

            >
              No Budgets Yet
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

              Create your first monthly
              budget above to start
              planning your spending.

            </Text>

          </View>

        ) : (


          /* =================================================
             BUDGET LIST
          ================================================= */

          <View
            style={
              styles.budgetList
            }
          >

            {budgets.map(
              (budget) => (

                <View

                  key={
                    budget.id
                  }

                  style={[

                    styles.budgetCard,

                    {
                      backgroundColor:
                        colors.card,

                      borderColor:
                        colors.border,
                    },

                  ]}

                >

                  {/* =====================================
                      TOP
                  ===================================== */}

                  <View
                    style={
                      styles.budgetTop
                    }
                  >

                    <View>

                      <Text

                        style={[
                          styles.budgetMonth,
                          {
                            color:
                              colors.text,
                          },
                        ]}

                      >

                        {getMonthName(
                          budget.month
                        )}

                      </Text>


                      <Text

                        style={[
                          styles.budgetYear,
                          {
                            color:
                              colors.mutedText,
                          },
                        ]}

                      >

                        {budget.year}

                      </Text>

                    </View>


                    <Text

                      style={[
                        styles.budgetAmount,
                        {
                          color:
                            colors.primary,
                        },
                      ]}

                    >

                      KSh{" "}
                      {formatAmount(
                        budget.budget_amount
                      )}

                    </Text>

                  </View>


                  {/* =====================================
                      ACTIONS
                  ===================================== */}

                  <View
                    style={
                      styles.actionRow
                    }
                  >

                    {/* EDIT */}

                    <Pressable

                      style={[

                        styles.editButton,

                        {
                          backgroundColor:
                            isDarkMode
                              ? "#1E3A8A"
                              : "#EFF6FF",
                        },

                      ]}

                      onPress={() =>
                        handleEdit(
                          budget
                        )
                      }

                    >

                      <Text

                        style={[
                          styles.editButtonText,
                          {
                            color:
                              colors.primary,
                          },
                        ]}

                      >
                        Edit
                      </Text>

                    </Pressable>


                    {/* DELETE */}

                    <Pressable

                      style={[

                        styles.deleteButton,

                        {
                          backgroundColor:
                            isDarkMode
                              ? "#451A1A"
                              : "#FEF2F2",
                        },

                      ]}

                      onPress={() =>
                        handleDelete(
                          budget
                        )
                      }

                    >

                      <Text

                        style={[
                          styles.deleteButtonText,
                          {
                            color:
                              colors.danger,
                          },
                        ]}

                      >
                        Delete
                      </Text>

                    </Pressable>

                  </View>

                </View>

              )
            )}

          </View>

        )}


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
// STATIC STYLES
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
    marginBottom: 24,
  },


  backButtonContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
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
  // SUMMARY
  // ===================================================

  summaryCard: {
    borderRadius: 18,
    padding: 22,
    marginBottom: 18,
  },


  summaryLabel: {
    color: "#DCE7FF",
    fontSize: 14,
  },


  summaryAmount: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 7,
  },


  summaryCount: {
    color: "#DCE7FF",
    fontSize: 13,
    marginTop: 8,
  },


  // ===================================================
  // FORM
  // ===================================================

  formCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
  },


  formTitle: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 4,
  },


  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },


  // ===================================================
  // MONTH SELECTOR
  // ===================================================

  monthContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },


  monthButton: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 20,
    borderWidth: 1,
  },


  monthButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },


  // ===================================================
  // INPUT
  // ===================================================

  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
  },


  // ===================================================
  // SAVE
  // ===================================================

  saveButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },


  disabledButton: {
    opacity: 0.6,
  },


  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },


  cancelButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },


  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },


  // ===================================================
  // SECTION
  // ===================================================

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },


  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
  },


  countText: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "700",
  },


  // ===================================================
  // EMPTY
  // ===================================================

  emptyCard: {
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
  },


  emptyIcon: {
    fontSize: 45,
    marginBottom: 12,
  },


  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 8,
  },


  emptyText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
  },


  // ===================================================
  // BUDGET LIST
  // ===================================================

  budgetList: {
    gap: 12,
  },


  budgetCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },


  budgetTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },


  budgetMonth: {
    fontSize: 17,
    fontWeight: "800",
  },


  budgetYear: {
    fontSize: 13,
    marginTop: 3,
  },


  budgetAmount: {
    fontSize: 17,
    fontWeight: "800",
  },


  // ===================================================
  // ACTIONS
  // ===================================================

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },


  editButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },


  editButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },


  deleteButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },


  deleteButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },


  bottomSpace: {
    height: 20,
  },

});