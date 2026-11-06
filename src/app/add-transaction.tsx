import React, { useEffect, useState } from "react";

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

import { MaterialCommunityIcons } from "@expo/vector-icons";

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
  const { token } = useAuth();
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  // Premium theme colours
  const navy = "#142B4A";
  const green = "#16A085";
  const coral = "#E76F51";

  // ===================================================
  // CATEGORY ICONS AND COLOURS
  // ===================================================

  const getCategoryStyle = (categoryName: string) => {
    const name = categoryName.toLowerCase();

    if (/food|meal|restaurant|grocery|groceries/.test(name)) {
      return {
        icon: "food-fork-drink" as const,
        color: "#E58B32",
        background: "#FFF1DF",
      };
    }

    if (/transport|bus|taxi|fare|fuel|travel/.test(name)) {
      return {
        icon: "bus" as const,
        color: "#4169E1",
        background: "#E8EEFF",
      };
    }

    if (/education|school|book|tuition|learning/.test(name)) {
      return {
        icon: "book-open-page-variant" as const,
        color: "#8956C8",
        background: "#F0E8FF",
      };
    }

    if (/rent|house|housing|accommodation/.test(name)) {
      return {
        icon: "home-outline" as const,
        color: "#D68A25",
        background: "#FFF1DF",
      };
    }

    if (/health|medical|hospital|medicine|pharmacy/.test(name)) {
      return {
        icon: "heart-pulse" as const,
        color: "#DC5656",
        background: "#FCE8E8",
      };
    }

    if (/shopping|clothes|fashion/.test(name)) {
      return {
        icon: "shopping-outline" as const,
        color: "#D65A91",
        background: "#FCE8F0",
      };
    }

    if (/entertainment|movie|music|game/.test(name)) {
      return {
        icon: "gamepad-variant-outline" as const,
        color: "#8956C8",
        background: "#F0E8FF",
      };
    }

    if (/salary|wage|allowance|pocket money/.test(name)) {
      return {
        icon: "wallet-outline" as const,
        color: "#16A085",
        background: "#E1F5EF",
      };
    }

    if (/business|freelance|investment|profit/.test(name)) {
      return {
        icon: "briefcase-outline" as const,
        color: "#3186A8",
        background: "#E5F4FA",
      };
    }

    if (/saving|savings/.test(name)) {
      return {
        icon: "piggy-bank-outline" as const,
        color: "#16A085",
        background: "#E1F5EF",
      };
    }

    return {
      icon: "dots-horizontal-circle-outline" as const,
      color: "#718096",
      background: "#EDF0F4",
    };
  };

  // ===================================================
  // TRANSACTION TYPE
  // ===================================================

  const [type, setType] = useState<"Income" | "Expense">("Expense");

  // ===================================================
  // CATEGORIES
  // ===================================================

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [customCategory, setCustomCategory] = useState("");

  // ===================================================
  // TRANSACTION DETAILS
  // ===================================================

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const getLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const [transactionDate, setTransactionDate] = useState(getLocalDate());

  // ===================================================
  // LOADING STATES
  // ===================================================

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);

  // ===================================================
  // LOAD CATEGORIES
  // ===================================================

  useEffect(() => {
    const loadCategories = async () => {
      if (!token) {
        setLoadingCategories(false);
        return;
      }

      try {
        setLoadingCategories(true);

        const response = await getCategories(token);

        setCategories(response.categories || []);
      } catch (error) {
        Alert.alert(
          "Unable to load categories",
          error instanceof Error
            ? error.message
            : "Please try again."
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [token]);

  // ===================================================
  // FILTER CATEGORIES BY TYPE
  // ===================================================

  const filteredCategories = categories.filter(
    (category) => category.type === type
  );

  // ===================================================
  // SELECTED CATEGORY
  // ===================================================

  const selectedCategory = categories.find(
    (category) => category.id === categoryId
  );

  const isOtherCategory =
    selectedCategory?.category_name
      .toLowerCase()
      .includes("other") ?? false;

  // ===================================================
  // CHANGE TRANSACTION TYPE
  // ===================================================

  const changeType = (newType: "Income" | "Expense") => {
    setType(newType);
    setCategoryId(null);
    setCustomCategory("");
  };

  // ===================================================
  // SELECT CATEGORY
  // ===================================================

  const selectCategory = (category: Category) => {
    setCategoryId(category.id);

    if (!category.category_name.toLowerCase().includes("other")) {
      setCustomCategory("");
    }
  };

  // ===================================================
  // SAVE TRANSACTION
  // ===================================================

  const handleSave = async () => {
    if (!token) {
      Alert.alert("Login required", "You are not logged in.");
      return;
    }

    if (!categoryId) {
      Alert.alert("Missing category", "Please select a category.");
      return;
    }

    if (!amount.trim()) {
      Alert.alert("Missing amount", "Please enter the amount.");
      return;
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      Alert.alert(
        "Invalid amount",
        "Please enter a valid amount greater than zero."
      );
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate.trim())) {
      Alert.alert(
        "Invalid date",
        "Please enter the date in YYYY-MM-DD format."
      );
      return;
    }

    const parsedDate = new Date(
      `${transactionDate.trim()}T00:00:00`
    );

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.getFullYear() !== Number(transactionDate.slice(0, 4)) ||
      parsedDate.getMonth() + 1 !== Number(transactionDate.slice(5, 7)) ||
      parsedDate.getDate() !== Number(transactionDate.slice(8, 10))
    ) {
      Alert.alert(
        "Invalid date",
        "Please enter a valid calendar date."
      );
      return;
    }

    if (isOtherCategory && !customCategory.trim()) {
      Alert.alert(
        "Missing category",
        "Please enter a custom category name."
      );
      return;
    }

    if (
      isOtherCategory &&
      (
        customCategory.trim().length < 2 ||
        customCategory.trim().length > 50
      )
    ) {
      Alert.alert(
        "Invalid category",
        "Custom category must contain between 2 and 50 characters."
      );
      return;
    }

    try {
      setSaving(true);

      const transactionData = {
        category_id: categoryId,
        custom_category: isOtherCategory
          ? customCategory.trim()
          : undefined,
        amount: numericAmount,
        description: description.trim(),
        transaction_date: transactionDate.trim(),
      };

      await createTransaction(token, transactionData);

      Alert.alert(
        "Transaction saved",
        `${type} has been added successfully.`,
        [
          {
            text: "Done",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Unable to save",
        error instanceof Error
          ? error.message
          : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // UI
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.backIcon, { color: colors.text }]}>
              ‹
            </Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Add Transaction
            </Text>

            <Text
              style={[
                styles.headerSubtitle,
                { color: colors.secondaryText },
              ]}
            >
              Record your money activity
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* AMOUNT CARD */}

        <View style={[styles.amountCard, { backgroundColor: navy }]}>
          <Text style={styles.amountCaption}>
            {type === "Income" ? "Income amount" : "Expense amount"}
          </Text>

          <View style={styles.amountInputRow}>
            <Text style={styles.currencySymbol}>KSh</Text>

            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#AAB8CA"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              selectionColor="#FFFFFF"
            />
          </View>

          <View style={styles.amountDivider} />

          <Text style={styles.amountHint}>
            Enter the amount in Kenyan Shillings
          </Text>
        </View>

        {/* TRANSACTION TYPE */}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Transaction type
        </Text>

        <View style={styles.typeRow}>
          <Pressable
            onPress={() => changeType("Expense")}
            style={[
              styles.typeCard,
              {
                backgroundColor: colors.card,
                borderColor:
                  type === "Expense" ? coral : colors.border,
                borderWidth: type === "Expense" ? 2 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.typeIcon,
                { backgroundColor: "#FCEAE5" },
              ]}
            >
              <Text style={styles.typeIconText}>↗</Text>
            </View>

            <View>
              <Text
                style={[
                  styles.typeCardTitle,
                  { color: colors.text },
                ]}
              >
                Expense
              </Text>

              <Text
                style={[
                  styles.typeCardSubtitle,
                  { color: colors.secondaryText },
                ]}
              >
                Money spent
              </Text>
            </View>

            <View
              style={[
                styles.radioOuter,
                {
                  borderColor:
                    type === "Expense" ? coral : colors.border,
                },
              ]}
            >
              {type === "Expense" && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: coral },
                  ]}
                />
              )}
            </View>
          </Pressable>

          <Pressable
            onPress={() => changeType("Income")}
            style={[
              styles.typeCard,
              {
                backgroundColor: colors.card,
                borderColor:
                  type === "Income" ? green : colors.border,
                borderWidth: type === "Income" ? 2 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.typeIcon,
                { backgroundColor: "#E1F5EF" },
              ]}
            >
              <Text style={[styles.typeIconText, { color: green }]}>
                ↙
              </Text>
            </View>

            <View>
              <Text
                style={[
                  styles.typeCardTitle,
                  { color: colors.text },
                ]}
              >
                Income
              </Text>

              <Text
                style={[
                  styles.typeCardSubtitle,
                  { color: colors.secondaryText },
                ]}
              >
                Money received
              </Text>
            </View>

            <View
              style={[
                styles.radioOuter,
                {
                  borderColor:
                    type === "Income" ? green : colors.border,
                },
              ]}
            >
              {type === "Income" && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: green },
                  ]}
                />
              )}
            </View>
          </Pressable>
        </View>

        {/* CATEGORY */}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Select category
          </Text>

          <Text
            style={[
              styles.optionalText,
              { color: colors.secondaryText },
            ]}
          >
            Required
          </Text>
        </View>

        {loadingCategories ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={green} size="small" />
            <Text
              style={[
                styles.loadingText,
                { color: colors.secondaryText },
              ]}
            >
              Loading categories...
            </Text>
          </View>
        ) : filteredCategories.length === 0 ? (
          <View
            style={[
              styles.emptyCategory,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.emptyCategoryText,
                { color: colors.secondaryText },
              ]}
            >
              No {type.toLowerCase()} categories available.
            </Text>
          </View>
        ) : (
          <View style={styles.categoryContainer}>
            {filteredCategories.map((category) => {
              const selected = categoryId === category.id;
              const categoryStyle = getCategoryStyle(
                category.category_name
              );

              return (
                <Pressable
                  key={category.id}
                  onPress={() => selectCategory(category)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: selected
                        ? isDarkMode
                          ? "#174B42"
                          : "#E1F5EF"
                        : colors.card,
                      borderColor: selected
                        ? green
                        : colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.categoryIconContainer,
                      {
                        backgroundColor:
                          isDarkMode && selected
                            ? "#21685A"
                            : categoryStyle.background,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={categoryStyle.icon}
                      size={21}
                      color={categoryStyle.color}
                    />
                  </View>

                  <Text
                    style={[
                      styles.categoryChipText,
                      {
                        color: selected
                          ? green
                          : colors.text,
                      },
                    ]}
                  >
                    {category.category_name}
                  </Text>

                  {selected && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={16}
                      color={green}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* CUSTOM CATEGORY */}

        {isOtherCategory && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Custom category
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Enter your category name"
              placeholderTextColor={colors.mutedText}
              value={customCategory}
              onChangeText={setCustomCategory}
              maxLength={50}
            />

            <Text
              style={[
                styles.helperText,
                { color: colors.secondaryText },
              ]}
            >
              Example: Medical, Internet, Gym or Freelance.
            </Text>
          </>
        )}

        {/* DESCRIPTION */}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Description
          <Text
            style={[
              styles.optionalText,
              { color: colors.secondaryText },
            ]}
          >
            {" "} (Optional)
          </Text>
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.descriptionInput,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="What was this transaction for?"
          placeholderTextColor={colors.mutedText}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        {/* DATE */}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Transaction date
        </Text>

        <View
          style={[
            styles.dateContainer,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={styles.dateIcon}>▦</Text>

          <TextInput
            style={[
              styles.dateInput,
              { color: colors.text },
            ]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedText}
            value={transactionDate}
            onChangeText={setTransactionDate}
          />
        </View>

        <Text
          style={[
            styles.helperText,
            { color: colors.secondaryText },
          ]}
        >
          Use the format YYYY-MM-DD, for example 2026-11-03.
        </Text>

        {/* SAVE BUTTON */}

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
              <Text style={styles.saveButtonText}>
                Save {type}
              </Text>

              <Text style={styles.saveButtonArrow}>
                →
              </Text>
            </>
          )}
        </Pressable>

        <Text
          style={[
            styles.footerText,
            { color: colors.secondaryText },
          ]}
        >
          Keep track of every shilling. Build better financial habits.
        </Text>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 45,
  },

  // HEADER

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    fontSize: 34,
    lineHeight: 38,
    marginTop: -3,
  },

  headerText: {
    flex: 1,
    marginLeft: 14,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
  },

  headerSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  headerSpacer: {
    width: 10,
  },

  // AMOUNT CARD

  amountCard: {
    borderRadius: 23,
    padding: 22,
    marginBottom: 27,
    elevation: 5,
    shadowColor: "#142B4A",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  amountCaption: {
    color: "#C8D5E5",
    fontSize: 13,
    fontWeight: "600",
  },

  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 13,
  },

  currencySymbol: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginRight: 12,
  },

  amountInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 35,
    fontWeight: "800",
    paddingVertical: 5,
  },

  amountDivider: {
    height: 1,
    backgroundColor: "#405571",
    marginTop: 12,
    marginBottom: 12,
  },

  amountHint: {
    color: "#C8D5E5",
    fontSize: 11,
  },

  // SECTION HEADINGS

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 11,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 3,
  },

  optionalText: {
    fontSize: 11,
    fontWeight: "500",
  },

  // TYPE CARDS

  typeRow: {
    flexDirection: "row",
    gap: 11,
  },

  typeCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 17,
    padding: 12,
    borderWidth: 1,
    justifyContent: "space-between",
  },

  typeIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  typeIconText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#E76F51",
  },

  typeCardTitle: {
    fontSize: 14,
    fontWeight: "800",
  },

  typeCardSubtitle: {
    fontSize: 10,
    marginTop: 3,
  },

  radioOuter: {
    position: "absolute",
    right: 12,
    top: 15,
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  // CATEGORY

  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 48,
  },

  categoryIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryChipText: {
    fontSize: 12,
    fontWeight: "700",
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    gap: 10,
  },

  loadingText: {
    fontSize: 13,
  },

  emptyCategory: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },

  emptyCategoryText: {
    fontSize: 13,
  },

  // INPUTS

  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 14,
  },

  descriptionInput: {
    height: 105,
    paddingTop: 15,
  },

  helperText: {
    fontSize: 11,
    marginTop: 7,
    lineHeight: 17,
  },

  // DATE

  dateContainer: {
    minHeight: 53,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  dateIcon: {
    fontSize: 20,
    color: "#16A085",
    marginRight: 12,
  },

  dateInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 12,
  },

  // SAVE BUTTON

  saveButton: {
    height: 57,
    borderRadius: 16,
    backgroundColor: "#16A085",
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#16A085",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  saveButtonArrow: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "700",
    marginLeft: 12,
  },

  disabledButton: {
    opacity: 0.6,
  },

  footerText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 17,
    lineHeight: 17,
  },
});