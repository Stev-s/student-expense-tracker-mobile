import React, { useEffect, useState } from "react";

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import { useAuth } from "@/context/AuthContext";

import {
  Category,
  getCategories,
} from "@/services/categoryService";

import {
  createTransaction,
} from "@/services/transactionService";

import {
  useTheme,
  lightColors,
  darkColors,
} from "@/context/ThemeContext";


// =====================================================
// ADD TRANSACTION SCREEN
// =====================================================

export default function AddTransactionScreen() {

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
  // TRANSACTION TYPE
  // ===================================================

  const [type, setType] =
    useState<"Income" | "Expense">("Expense");


  // ===================================================
  // CATEGORIES
  // ===================================================

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [categoryId, setCategoryId] =
    useState<number | null>(null);


  // ===================================================
  // CUSTOM CATEGORY
  // ===================================================

  const [customCategory, setCustomCategory] =
    useState("");


  // ===================================================
  // TRANSACTION DETAILS
  // ===================================================

  const [amount, setAmount] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [transactionDate, setTransactionDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );


  // ===================================================
  // LOADING STATES
  // ===================================================

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [saving, setSaving] =
    useState(false);


  // ===================================================
  // LOAD CATEGORIES
  // ===================================================

  useEffect(() => {

    loadCategories();

  }, [token]);


  const loadCategories = async () => {

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
  // FILTER CATEGORIES BY TYPE
  // ===================================================

  const filteredCategories =
    categories.filter(
      (category) =>
        category.type === type
    );


  // ===================================================
  // SELECTED CATEGORY
  // ===================================================

  const selectedCategory =
    categories.find(
      (category) =>
        category.id === categoryId
    );


  // ===================================================
  // CHECK IF "OTHER" IS SELECTED
  // ===================================================

  const isOtherCategory =
    selectedCategory?.category_name
      .toLowerCase().includes("other");


  // ===================================================
  // CHANGE TRANSACTION TYPE
  // ===================================================

  const changeType = (
    newType: "Income" | "Expense"
  ) => {

    setType(newType);

    setCategoryId(null);

    setCustomCategory("");

  };


  // ===================================================
  // SELECT CATEGORY
  // ===================================================

  const selectCategory = (
    category: Category
  ) => {

    setCategoryId(category.id);


    if (
      category.category_name
        .toLowerCase() !== "other"
    ) {

      setCustomCategory("");

    }

  };


  // ===================================================
  // SAVE TRANSACTION
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
    // CHECK CATEGORY
    // =================================================

    if (!categoryId) {

      Alert.alert(
        "Missing category",
        "Please select a category."
      );

      return;

    }


    // =================================================
    // CHECK AMOUNT
    // =================================================

    if (!amount.trim()) {

      Alert.alert(
        "Missing amount",
        "Please enter the amount."
      );

      return;

    }


    // =================================================
    // CONVERT AMOUNT TO NUMBER
    // =================================================

    const numericAmount =
      Number(amount);


    // =================================================
    // VALIDATE AMOUNT
    // =================================================

    if (
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {

      Alert.alert(
        "Invalid amount",
        "Please enter a valid amount greater than zero."
      );

      return;

    }


    // =================================================
    // CHECK DATE
    // =================================================

    if (!transactionDate.trim()) {

      Alert.alert(
        "Missing date",
        "Please enter the transaction date."
      );

      return;

    }


    // =================================================
    // CHECK CUSTOM CATEGORY
    // =================================================

    if (
      isOtherCategory &&
      !customCategory.trim()
    ) {

      Alert.alert(
        "Missing category",
        "Please enter a custom category name."
      );

      return;

    }


    // =================================================
    // VALIDATE CUSTOM CATEGORY LENGTH
    // =================================================

    if (
      isOtherCategory &&
      customCategory.trim().length < 2
    ) {

      Alert.alert(
        "Invalid category",
        "Custom category must contain at least 2 characters."
      );

      return;

    }


    if (
      isOtherCategory &&
      customCategory.trim().length > 50
    ) {

      Alert.alert(
        "Invalid category",
        "Custom category must not exceed 50 characters."
      );

      return;

    }


    // =================================================
    // SAVE
    // =================================================

    try {

      setSaving(true);


      // =================================================
      // PREPARE TRANSACTION DATA
      // =================================================

      const transactionData = {

        category_id:
          categoryId,

        custom_category:
          isOtherCategory
            ? customCategory.trim()
            : undefined,

        amount:
          numericAmount,

        description:
          description.trim(),

        transaction_date:
          transactionDate.trim(),

      };


      // =================================================
      // SEND TO BACKEND
      // =================================================

      await createTransaction(
        token,
        transactionData
      );


      // =================================================
      // SUCCESS
      // =================================================

      Alert.alert(
        "Success",
        "Transaction added successfully.",
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

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to add transaction."
      );


    } finally {

      setSaving(false);

    }

  };


  // =====================================================
  // UI
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

        keyboardShouldPersistTaps="handled"

        showsVerticalScrollIndicator={
          false
        }
      >


        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>

          <Pressable
            onPress={() =>
              router.back()
            }

            style={[
              styles.backButtonContainer,
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
            Add Transaction
          </Text>


          <View
            style={styles.headerSpace}
          />

        </View>


        {/* =================================================
            TRANSACTION TYPE
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


        <View style={styles.typeRow}>


          {/* EXPENSE */}

          <Pressable

            style={[
              styles.typeButton,

              {
                backgroundColor:
                  colors.card,

                borderColor:
                  colors.border,
              },

              type === "Expense" &&
                styles.activeExpense,
            ]}

            onPress={() =>
              changeType("Expense")
            }

          >

            <Text
              style={[
                styles.typeText,

                {
                  color:
                    colors.secondaryText,
                },

                type === "Expense" &&
                  styles.activeTypeText,
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
                  colors.card,

                borderColor:
                  colors.border,
              },

              type === "Income" &&
                styles.activeIncome,
            ]}

            onPress={() =>
              changeType("Income")
            }

          >

            <Text
              style={[
                styles.typeText,

                {
                  color:
                    colors.secondaryText,
                },

                type === "Income" &&
                  styles.activeTypeText,
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

          placeholder="Enter amount"

          placeholderTextColor={
            colors.mutedText
          }

          value={amount}

          onChangeText={
            setAmount
          }

          keyboardType="decimal-pad"

        />


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

        ) : filteredCategories.length === 0 ? (

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

        ) : (

          <View
            style={
              styles.categoryContainer
            }
          >

            {filteredCategories.map(
              (category) => (

                <Pressable

                  key={category.id}

                  style={[
                    styles.categoryButton,

                    {
                      backgroundColor:
                        colors.card,

                      borderColor:
                        colors.border,
                    },

                    categoryId ===
                      category.id &&
                      styles.selectedCategory,
                  ]}

                  onPress={() =>
                    selectCategory(category)
                  }

                >

                  <Text

                    style={[
                      styles.categoryText,

                      {
                        color:
                          colors.secondaryText,
                      },

                      categoryId ===
                        category.id &&
                        styles.selectedCategoryText,
                    ]}

                  >

                    {
                      category.category_name
                    }

                  </Text>

                </Pressable>

              )
            )}

          </View>

        )}


        {/* =================================================
            CUSTOM CATEGORY
        ================================================= */}

        {isOtherCategory && (

          <>

            <Text
              style={[
                styles.label,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Custom Category
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

              placeholder="Enter your category"

              placeholderTextColor={
                colors.mutedText
              }

              value={
                customCategory
              }

              onChangeText={
                setCustomCategory
              }

              maxLength={50}

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
              Example: Medical, Internet,
              Gym, Freelance, etc.
            </Text>

          </>

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
            SAVE BUTTON
        ================================================= */}

        <Pressable

          style={[
            styles.saveButton,

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
              : "Add Transaction"}

          </Text>

        </Pressable>


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

    marginBottom: 28,

  },


  backButtonContainer: {

    width: 42,

    height: 42,

    borderRadius: 21,

    justifyContent: "center",

    alignItems: "center",

    borderWidth: 1,

  },


  backButton: {

    fontSize: 34,

    lineHeight: 38,

  },


  headerSpace: {

    width: 42,

  },


  title: {

    fontSize: 22,

    fontWeight: "800",

  },


  // ===================================================
  // LABEL
  // ===================================================

  label: {

    fontSize: 14,

    fontWeight: "600",

    marginBottom: 8,

    marginTop: 18,

  },


  // ===================================================
  // TYPE BUTTONS
  // ===================================================

  typeRow: {

    flexDirection: "row",

    gap: 12,

  },


  typeButton: {

    flex: 1,

    height: 48,

    borderRadius: 12,

    borderWidth: 1,

    justifyContent: "center",

    alignItems: "center",

  },


  activeExpense: {

    backgroundColor: "#DC2626",

    borderColor: "#DC2626",

  },


  activeIncome: {

    backgroundColor: "#16A34A",

    borderColor: "#16A34A",

  },


  typeText: {

    fontSize: 15,

    fontWeight: "600",

  },


  activeTypeText: {

    color: "#FFFFFF",

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


  descriptionInput: {

    height: 100,

    paddingTop: 14,

  },


  // ===================================================
  // CATEGORY
  // ===================================================

  categoryContainer: {

    flexDirection: "row",

    flexWrap: "wrap",

    gap: 10,

  },


  categoryButton: {

    paddingHorizontal: 16,

    paddingVertical: 11,

    borderRadius: 20,

    borderWidth: 1,

  },


  selectedCategory: {

    backgroundColor: "#2563EB",

    borderColor: "#2563EB",

  },


  categoryText: {

    fontSize: 14,

    fontWeight: "600",

  },


  selectedCategoryText: {

    color: "#FFFFFF",

  },


  // ===================================================
  // INFORMATION TEXT
  // ===================================================

  infoText: {

    fontSize: 14,

    marginTop: 4,

  },


  // ===================================================
  // SAVE BUTTON
  // ===================================================

  saveButton: {

    height: 54,

    borderRadius: 12,

    backgroundColor: "#2563EB",

    justifyContent: "center",

    alignItems: "center",

    marginTop: 30,

  },


  disabledButton: {

    opacity: 0.6,

  },


  saveButtonText: {

    color: "#FFFFFF",

    fontSize: 16,

    fontWeight: "700",

  },

});