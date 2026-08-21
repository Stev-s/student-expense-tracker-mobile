import React, {
  useEffect,
  useState,
} from "react";

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

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { useAuth } from "@/context/AuthContext";

import {
  useTheme,
} from "@/context/ThemeContext";

import {
  Category,
  getCategories,
} from "@/services/categoryService";

import {
  getTransaction,
  updateTransaction,
  Transaction,
} from "@/services/transactionService";


// =====================================================
// EDIT TRANSACTION SCREEN
// =====================================================

export default function EditTransactionScreen() {

  // ===================================================
  // AUTHENTICATION
  // ===================================================

  const { token } = useAuth();


  // ===================================================
  // THEME
  // ===================================================

  const {
    colors,
    isDarkMode,
  } = useTheme();


  // ===================================================
  // GET TRANSACTION ID
  // ===================================================

  const params =
    useLocalSearchParams();

  const transactionId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;


  // ===================================================
  // TRANSACTION
  // ===================================================

  const [
    transaction,
    setTransaction,
  ] = useState<Transaction | null>(null);


  // ===================================================
  // TRANSACTION TYPE
  // ===================================================

  const [
    type,
    setType,
  ] = useState<
    "Income" | "Expense"
  >("Expense");


  // ===================================================
  // CATEGORIES
  // ===================================================

  const [
    categories,
    setCategories,
  ] = useState<Category[]>([]);


  const [
    categoryId,
    setCategoryId,
  ] = useState<number | null>(null);


  // ===================================================
  // FORM
  // ===================================================

  const [
    amount,
    setAmount,
  ] = useState("");


  const [
    description,
    setDescription,
  ] = useState("");


  const [
    transactionDate,
    setTransactionDate,
  ] = useState("");


  // ===================================================
  // LOADING
  // ===================================================

  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    loadingCategories,
    setLoadingCategories,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  // ===================================================
  // LOAD TRANSACTION
  // ===================================================

  useEffect(() => {

    loadTransaction();

  }, [
    token,
    transactionId,
  ]);


  const loadTransaction =
    async () => {

      if (!token) {

        setLoading(false);

        return;

      }


      if (!transactionId) {

        Alert.alert(
          "Error",
          "Transaction ID was not provided.",
          [
            {
              text: "OK",
              onPress: () =>
                router.back(),
            },
          ]
        );

        setLoading(false);

        return;

      }


      try {

        setLoading(true);


        const response =
          await getTransaction(
            token,
            Number(transactionId)
          );


        if (
          !response.success ||
          !response.transaction
        ) {

          Alert.alert(
            "Transaction Not Found",
            response.message ||
              "The transaction could not be found.",
            [
              {
                text: "OK",
                onPress: () =>
                  router.back(),
              },
            ]
          );

          return;

        }


        const data =
          response.transaction;


        setTransaction(data);


        // =============================================
        // TYPE
        // =============================================

        setType(
          data.type === "Income"
            ? "Income"
            : "Expense"
        );


        // =============================================
        // CATEGORY
        // =============================================

        setCategoryId(
          data.category_id
        );


        // =============================================
        // AMOUNT
        // =============================================

        setAmount(
          String(data.amount)
        );


        // =============================================
        // DESCRIPTION
        // =============================================

        setDescription(
          data.description || ""
        );


        // =============================================
        // DATE
        // =============================================

        setTransactionDate(
          data.transaction_date
            ? String(
                data.transaction_date
              ).split("T")[0]
            : ""
        );

      } catch (error) {

        console.error(
          "Load transaction error:",
          error
        );


        Alert.alert(
          "Error",
          error instanceof Error
            ? error.message
            : "Unable to load transaction.",
          [
            {
              text: "OK",
              onPress: () =>
                router.back(),
            },
          ]
        );

      } finally {

        setLoading(false);

      }

    };


  // ===================================================
  // LOAD CATEGORIES
  // ===================================================

  useEffect(() => {

    loadCategories();

  }, [token]);


  const loadCategories =
    async () => {

      if (!token) {

        setLoadingCategories(false);

        return;

      }


      try {

        setLoadingCategories(true);


        const response =
          await getCategories(token);


        setCategories(
          response.categories || []
        );

      } catch (error) {

        console.error(
          "Load categories error:",
          error
        );


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


  // ===================================================
  // FILTER CATEGORIES
  // ===================================================

  const filteredCategories =
    categories.filter(
      (category) =>
        category.type === type
    );


  // ===================================================
  // CHANGE TYPE
  // ===================================================

  const changeType = (
    newType:
      | "Income"
      | "Expense"
  ) => {

    if (newType === type) {
      return;
    }


    setType(newType);

    // A category belongs to a
    // particular transaction type.
    setCategoryId(null);

  };


  // ===================================================
  // SELECT CATEGORY
  // ===================================================

  const selectCategory = (
    category: Category
  ) => {

    setCategoryId(
      category.id
    );

  };


  // ===================================================
  // SAVE CHANGES
  // ===================================================

  const handleUpdate =
    async () => {

      // ===============================================
      // LOGIN
      // ===============================================

      if (!token) {

        Alert.alert(
          "Error",
          "You are not logged in."
        );

        return;

      }


      // ===============================================
      // TRANSACTION ID
      // ===============================================

      if (!transactionId) {

        Alert.alert(
          "Error",
          "Transaction ID is missing."
        );

        return;

      }


      // ===============================================
      // CATEGORY
      // ===============================================

      if (!categoryId) {

        Alert.alert(
          "Missing Category",
          "Please select a category."
        );

        return;

      }


      // ===============================================
      // AMOUNT
      // ===============================================

      if (!amount.trim()) {

        Alert.alert(
          "Missing Amount",
          "Please enter the transaction amount."
        );

        return;

      }


      const numericAmount =
        Number(amount);


      if (
        Number.isNaN(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {

        Alert.alert(
          "Invalid Amount",
          "Please enter a valid amount greater than zero."
        );

        return;

      }


      // ===============================================
      // DATE
      // ===============================================

      if (
        !transactionDate.trim()
      ) {

        Alert.alert(
          "Missing Date",
          "Please enter the transaction date."
        );

        return;

      }


      // ===============================================
      // DATE FORMAT
      // ===============================================

      const datePattern =
        /^\d{4}-\d{2}-\d{2}$/;


      if (
        !datePattern.test(
          transactionDate.trim()
        )
      ) {

        Alert.alert(
          "Invalid Date",
          "Please use the format YYYY-MM-DD."
        );

        return;

      }


      // ===============================================
      // UPDATE
      // ===============================================

      try {

        setSaving(true);


        const response =
          await updateTransaction(
            token,
            Number(transactionId),
            {
              category_id:
                categoryId,

              amount:
                numericAmount,

              description:
                description.trim(),

              transaction_date:
                transactionDate.trim(),
            }
          );


        if (!response.success) {

          Alert.alert(
            "Update Failed",
            response.message ||
              "Unable to update transaction."
          );

          return;

        }


        Alert.alert(
          "Success",
          "Transaction updated successfully.",
          [
            {
              text: "OK",

              onPress: () => {
                router.back();
              },
            },
          ]
        );

      } catch (error) {

        console.error(
          "Update transaction error:",
          error
        );


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


  // ===================================================
  // LOADING SCREEN
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
          Loading transaction...
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

        keyboardShouldPersistTaps="handled"

        showsVerticalScrollIndicator={false}

      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View
          style={styles.header}
        >

          <Pressable
            onPress={() =>
              router.back()
            }

            style={
              styles.backButtonContainer
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
              Edit Transaction
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
              Update your transaction details
            </Text>

          </View>


          <View
            style={styles.headerSpace}
          />

        </View>


        {/* =================================================
            TRANSACTION CARD
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

          {/* =================================================
              TYPE
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
            Transaction Type
          </Text>


          <View
            style={styles.typeRow}
          >

            {/* EXPENSE */}

            <Pressable

              style={[
                styles.typeButton,

                {
                  backgroundColor:
                    type === "Expense"
                      ? colors.danger
                      : colors.inputBackground,

                  borderColor:
                    type === "Expense"
                      ? colors.danger
                      : colors.border,
                },
              ]}

              onPress={() =>
                changeType("Expense")
              }

            >

              <View
                style={[
                  styles.typeIcon,
                  {
                    backgroundColor:
                      type === "Expense"
                        ? "rgba(255,255,255,0.18)"
                        : colors.iconBackground,
                  },
                ]}
              >

                <Text
                  style={[
                    styles.typeIconText,
                    {
                      color:
                        type === "Expense"
                          ? colors.white
                          : colors.danger,
                    },
                  ]}
                >
                  −
                </Text>

              </View>


              <Text
                style={[
                  styles.typeText,
                  {
                    color:
                      type === "Expense"
                        ? colors.white
                        : colors.text,
                  },
                ]}
              >
                Expense
              </Text>

            </Pressable>


            {/* INCOME */}

            <Pressable

              style={[
                styles.typeButton,

                {
                  backgroundColor:
                    type === "Income"
                      ? colors.success
                      : colors.inputBackground,

                  borderColor:
                    type === "Income"
                      ? colors.success
                      : colors.border,
                },
              ]}

              onPress={() =>
                changeType("Income")
              }

            >

              <View
                style={[
                  styles.typeIcon,
                  {
                    backgroundColor:
                      type === "Income"
                        ? "rgba(255,255,255,0.18)"
                        : colors.iconBackground,
                  },
                ]}
              >

                <Text
                  style={[
                    styles.typeIconText,
                    {
                      color:
                        type === "Income"
                          ? colors.white
                          : colors.success,
                    },
                  ]}
                >
                  +
                </Text>

              </View>


              <Text
                style={[
                  styles.typeText,
                  {
                    color:
                      type === "Income"
                        ? colors.white
                        : colors.text,
                  },
                ]}
              >
                Income
              </Text>

            </Pressable>

          </View>


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
            Amount
          </Text>


          <View
            style={[
              styles.amountContainer,
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
                styles.currency,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              KSh
            </Text>


            <TextInput

              style={[
                styles.amountInput,
                {
                  color:
                    colors.text,
                },
              ]}

              placeholder="0.00"

              placeholderTextColor={
                colors.mutedText
              }

              value={amount}

              onChangeText={
                setAmount
              }

              keyboardType="decimal-pad"

            />

          </View>


          {/* =================================================
              CATEGORY
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
            Category
          </Text>


          {loadingCategories ? (

            <View
              style={
                styles.categoryLoading
              }
            >

              <ActivityIndicator
                size="small"
                color={
                  colors.primary
                }
              />

              <Text
                style={[
                  styles.infoText,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                Loading categories...
              </Text>

            </View>

          ) : filteredCategories.length ===
            0 ? (

            <View
              style={[
                styles.infoCard,
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
                  styles.infoText,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                No{" "}
                {type.toLowerCase()}{" "}
                categories available.
              </Text>

            </View>

          ) : (

            <View
              style={
                styles.categoryContainer
              }
            >

              {filteredCategories.map(
                (category) => {

                  const selected =
                    categoryId ===
                    category.id;

                  return (

                    <Pressable

                      key={
                        category.id
                      }

                      style={[
                        styles.categoryButton,

                        {
                          backgroundColor:
                            selected
                              ? colors.primary
                              : colors.inputBackground,

                          borderColor:
                            selected
                              ? colors.primary
                              : colors.border,
                        },
                      ]}

                      onPress={() =>
                        selectCategory(
                          category
                        )
                      }

                    >

                      {selected && (

                        <Text
                          style={[
                            styles.checkMark,
                            {
                              color:
                                colors.white,
                            },
                          ]}
                        >
                          ✓
                        </Text>

                      )}


                      <Text
                        style={[
                          styles.categoryText,
                          {
                            color:
                              selected
                                ? colors.white
                                : colors.text,
                          },
                        ]}
                      >
                        {
                          category.category_name
                        }
                      </Text>

                    </Pressable>

                  );

                }
              )}

            </View>

          )}


          {/* =================================================
              DESCRIPTION
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
            Description
          </Text>


          <TextInput

            style={[
              styles.input,
              styles.descriptionInput,

              {
                backgroundColor:
                  colors.inputBackground,

                borderColor:
                  colors.border,

                color:
                  colors.text,
              },
            ]}

            placeholder="Enter description (optional)"

            placeholderTextColor={
              colors.mutedText
            }

            value={
              description
            }

            onChangeText={
              setDescription
            }

            multiline

            textAlignVertical="top"

          />


          {/* =================================================
              DATE
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
            Transaction Date
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

            placeholder="YYYY-MM-DD"

            placeholderTextColor={
              colors.mutedText
            }

            value={
              transactionDate
            }

            onChangeText={
              setTransactionDate
            }

          />


          {/* =================================================
              UPDATE BUTTON
          ================================================= */}

          <Pressable

            style={[
              styles.updateButton,

              {
                backgroundColor:
                  saving
                    ? colors.primary
                    : colors.primary,

                opacity:
                  saving ? 0.65 : 1,
              },
            ]}

            onPress={
              handleUpdate
            }

            disabled={
              saving
            }

          >

            {saving ? (

              <View
                style={
                  styles.savingContainer
                }
              >

                <ActivityIndicator
                  size="small"
                  color={
                    colors.white
                  }
                />

                <Text
                  style={
                    styles.updateButtonText
                  }
                >
                  Updating...
                </Text>

              </View>

            ) : (

              <Text
                style={
                  styles.updateButtonText
                }
              >
                Update Transaction
              </Text>

            )}

          </Pressable>


          {/* =================================================
              CANCEL
          ================================================= */}

          <Pressable

            style={[
              styles.cancelButton,

              {
                backgroundColor:
                  colors.inputBackground,

                borderColor:
                  colors.border,

                opacity:
                  saving ? 0.5 : 1,
              },
            ]}

            onPress={() =>
              router.back()
            }

            disabled={
              saving
            }

          >

            <Text
              style={[
                styles.cancelText,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              Cancel
            </Text>

          </Pressable>

        </View>


        {/* =================================================
            BOTTOM SPACE
        ================================================= */}

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

  // ===================================================
  // CONTAINER
  // ===================================================

  container: {
    flex: 1,
  },


  loadingContainer: {
    flex: 1,

    justifyContent:
      "center",

    alignItems:
      "center",
  },


  loadingText: {
    marginTop: 12,

    fontSize: 15,

    fontWeight: "500",
  },


  scrollContent: {
    padding: 20,

    paddingBottom: 50,
  },


  // ===================================================
  // HEADER
  // ===================================================

  header: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    marginBottom: 24,
  },


  backButtonContainer: {
    width: 42,

    height: 42,

    justifyContent:
      "center",

    alignItems:
      "flex-start",
  },


  backButton: {
    fontSize: 40,

    lineHeight: 40,

    fontWeight: "300",
  },


  headerTitleContainer: {
    flex: 1,

    alignItems:
      "center",
  },


  headerSpace: {
    width: 42,
  },


  title: {
    fontSize: 22,

    fontWeight: "800",

    textAlign:
      "center",
  },


  subtitle: {
    fontSize: 12,

    marginTop: 4,

    textAlign:
      "center",
  },


  // ===================================================
  // FORM CARD
  // ===================================================

  formCard: {
    borderRadius: 20,

    padding: 20,

    borderWidth: 1,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.06,

    shadowRadius: 12,

    elevation: 2,
  },


  // ===================================================
  // LABEL
  // ===================================================

  label: {
    fontSize: 14,

    fontWeight: "700",

    marginTop: 20,

    marginBottom: 9,
  },


  // ===================================================
  // TYPE
  // ===================================================

  typeRow: {
    flexDirection: "row",

    gap: 12,
  },


  typeButton: {
    flex: 1,

    minHeight: 58,

    borderRadius: 14,

    borderWidth: 1,

    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "center",

    gap: 9,
  },


  typeIcon: {
    width: 30,

    height: 30,

    borderRadius: 15,

    justifyContent:
      "center",

    alignItems:
      "center",
  },


  typeIconText: {
    fontSize: 21,

    fontWeight: "800",
  },


  typeText: {
    fontSize: 15,

    fontWeight: "700",
  },


  // ===================================================
  // AMOUNT
  // ===================================================

  amountContainer: {
    height: 58,

    borderRadius: 14,

    borderWidth: 1,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 15,
  },


  currency: {
    fontSize: 15,

    fontWeight: "700",

    marginRight: 8,
  },


  amountInput: {
    flex: 1,

    height: "100%",

    fontSize: 20,

    fontWeight: "700",

    padding: 0,
  },


  // ===================================================
  // INPUT
  // ===================================================

  input: {
    height: 52,

    borderRadius: 14,

    borderWidth: 1,

    paddingHorizontal: 15,

    fontSize: 15,
  },


  descriptionInput: {
    height: 105,

    paddingTop: 14,

    paddingBottom: 14,
  },


  // ===================================================
  // CATEGORY
  // ===================================================

  categoryContainer: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 9,
  },


  categoryButton: {
    minHeight: 42,

    paddingHorizontal: 14,

    paddingVertical: 10,

    borderRadius: 21,

    borderWidth: 1,

    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },


  categoryText: {
    fontSize: 13,

    fontWeight: "700",
  },


  checkMark: {
    fontSize: 13,

    fontWeight: "800",
  },


  categoryLoading: {
    flexDirection: "row",

    alignItems: "center",

    gap: 10,

    paddingVertical: 10,
  },


  infoCard: {
    borderWidth: 1,

    borderRadius: 12,

    padding: 13,
  },


  infoText: {
    fontSize: 13,

    lineHeight: 19,
  },


  // ===================================================
  // UPDATE
  // ===================================================

  updateButton: {
    height: 56,

    borderRadius: 14,

    justifyContent:
      "center",

    alignItems:
      "center",

    marginTop: 28,
  },


  savingContainer: {
    flexDirection: "row",

    alignItems: "center",

    gap: 10,
  },


  updateButtonText: {
    color: "#FFFFFF",

    fontSize: 15,

    fontWeight: "800",
  },


  // ===================================================
  // CANCEL
  // ===================================================

  cancelButton: {
    height: 52,

    borderRadius: 14,

    borderWidth: 1,

    justifyContent:
      "center",

    alignItems:
      "center",

    marginTop: 10,
  },


  cancelText: {
    fontSize: 15,

    fontWeight: "700",
  },


  // ===================================================
  // BOTTOM
  // ===================================================

  bottomSpace: {
    height: 20,
  },

});