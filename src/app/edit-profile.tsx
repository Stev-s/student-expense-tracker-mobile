
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

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "@/context/AuthContext";

import {
  useTheme,
  lightColors,
  darkColors,
} from "@/context/ThemeContext";

// =====================================================
// EDIT PROFILE SCREEN
// =====================================================

export default function EditProfileScreen() {

  // ===================================================
  // AUTH
  // ===================================================

  const {
    user,
    token,
    updateProfile,
  } = useAuth();

  // ===================================================
  // THEME
  // ===================================================

  const { isDarkMode } = useTheme();

  const colors = isDarkMode
    ? darkColors
    : lightColors;

  // ===================================================
  // FORM DATA
  // ===================================================

  const [fullName, setFullName] = useState(
    user?.full_name || ""
  );

  const [email, setEmail] = useState(
    user?.email || ""
  );

  const [phone, setPhone] = useState(
    user?.phone || ""
  );

  // ===================================================
  // SAVING STATE
  // ===================================================

  const [saving, setSaving] = useState(false);

  // ===================================================
  // UPDATE FORM WHEN USER DATA CHANGES
  // ===================================================

  useEffect(() => {

    if (!user) {
      return;
    }

    setFullName(user.full_name || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");

  }, [user]);

  // ===================================================
  // SAVE PROFILE
  // ===================================================

  const handleSave = async () => {

    if (!token || !user) {
      Alert.alert(
        "Error",
        "You are not logged in."
      );
      return;
    }

    // Validate full name

    if (!fullName.trim()) {
      Alert.alert(
        "Required",
        "Please enter your full name."
      );
      return;
    }

    // Validate email

    if (!email.trim()) {
      Alert.alert(
        "Required",
        "Please enter your email."
      );
      return;
    }

    // Correct email validation

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );
      return;
    }

    // Save profile

    try {

      setSaving(true);

      await updateProfile({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      Alert.alert(
        "Success",
        "Your profile has been updated successfully.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );

    } catch (error) {

      console.error(
        "Profile update error:",
        error
      );

      Alert.alert(
        "Update Failed",
        error instanceof Error
          ? error.message
          : "Unable to update your profile."
      );

    } finally {

      setSaving(false);

    }
  };

  // ===================================================
  // INPUT FIELD
  // ===================================================

  const FormField = ({
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    keyboardType = "default",
    autoCapitalize = "sentences",
    editable = true,
  }: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    keyboardType?: "default" | "email-address" | "phone-pad";
    autoCapitalize?: "none" | "sentences" | "words";
    editable?: boolean;
  }) => (

    <View style={styles.fieldContainer}>

      <Text
        style={[
          styles.label,
          { color: colors.text },
        ]}
      >
        {label}
      </Text>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
          },
        ]}
      >

        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={colors.secondaryText}
        />

        <TextInput
          style={[
            styles.input,
            { color: colors.text },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
        />

      </View>

    </View>
  );

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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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

            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.text}
            />

          </Pressable>

          <View style={styles.headerTextContainer}>

            <Text
              style={[
                styles.headerTitle,
                { color: colors.text },
              ]}
            >
              Edit Profile
            </Text>

            <Text
              style={[
                styles.headerSubtitle,
                { color: colors.secondaryText },
              ]}
            >
              Update your personal details
            </Text>

          </View>

          <View style={styles.headerSpacer} />

        </View>

        {/* PROFILE AVATAR */}

        <View
          style={[
            styles.avatarCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >

          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.primary },
            ]}
          >

            <Text style={styles.avatarText}>
              {fullName.trim().charAt(0).toUpperCase() || "S"}
            </Text>

            <View style={styles.avatarBadge}>
              <MaterialCommunityIcons
                name="pencil"
                size={13}
                color="#FFFFFF"
              />
            </View>

          </View>

          <Text
            style={[
              styles.avatarName,
              { color: colors.text },
            ]}
          >
            {fullName.trim() || "Student"}
          </Text>

          <Text
            style={[
              styles.avatarDescription,
              { color: colors.secondaryText },
            ]}
          >
            Your account information
          </Text>

        </View>

        {/* FORM HEADING */}

        <View style={styles.sectionHeader}>

          <View>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text },
              ]}
            >
              Personal Details
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                { color: colors.secondaryText },
              ]}
            >
              Keep your information up to date
            </Text>
          </View>

          <MaterialCommunityIcons
            name="account-edit-outline"
            size={25}
            color={colors.primary}
          />

        </View>

        {/* FORM CARD */}

        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >

          <FormField
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            icon="account-outline"
            autoCapitalize="words"
          />

          <FormField
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            icon="email-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <FormField
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            icon="phone-outline"
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          {/* INFORMATION NOTE */}

          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: isDarkMode
                  ? "#1C3445"
                  : "#EFF6FF",
              },
            ]}
          >

            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={colors.primary}
            />

            <Text
              style={[
                styles.infoText,
                { color: colors.secondaryText },
              ]}
            >
              Make sure your details are accurate so
              your account information stays up to date.
            </Text>

          </View>

          {/* SAVE BUTTON */}

          <Pressable
            style={[
              styles.saveButton,
              {
                backgroundColor: colors.primary,
                opacity: saving ? 0.7 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={saving}
          >

            {saving ? (

              <View style={styles.savingContainer}>

                <ActivityIndicator
                  color="#FFFFFF"
                  size="small"
                />

                <Text style={styles.saveButtonText}>
                  Saving Changes...
                </Text>

              </View>

            ) : (

              <View style={styles.savingContainer}>

                <MaterialCommunityIcons
                  name="content-save-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.saveButtonText}>
                  Save Changes
                </Text>

              </View>

            )}

          </Pressable>

          {/* CANCEL BUTTON */}

          <Pressable
            style={[
              styles.cancelButton,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                opacity: saving ? 0.5 : 1,
              },
            ]}
            onPress={() => router.back()}
            disabled={saving}
          >

            <Text
              style={[
                styles.cancelText,
                { color: colors.secondaryText },
              ]}
            >
              Cancel
            </Text>

          </Pressable>

        </View>

        {/* FOOTER */}

        <View style={styles.footer}>

          <MaterialCommunityIcons
            name="shield-check-outline"
            size={18}
            color={colors.secondaryText}
          />

          <Text
            style={[
              styles.footerText,
              { color: colors.secondaryText },
            ]}
          >
            Your personal information is managed securely.
          </Text>

        </View>

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

  scrollContent: {
    padding: 20,
    paddingBottom: 45,
  },

  // HEADER

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 14,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
  },

  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },

  headerSpacer: {
    width: 10,
  },

  // AVATAR

  avatarCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 23,
    alignItems: "center",
    marginBottom: 29,
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 37,
    fontWeight: "800",
  },

  avatarBadge: {
    position: "absolute",
    right: 0,
    bottom: 1,
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#16A085",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarName: {
    fontSize: 18,
    fontWeight: "800",
  },

  avatarDescription: {
    fontSize: 12,
    marginTop: 5,
  },

  // SECTION HEADER

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  sectionSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },

  // FORM CARD

  formCard: {
    borderRadius: 19,
    borderWidth: 1,
    padding: 18,
  },

  fieldContainer: {
    marginBottom: 19,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 9,
  },

  inputContainer: {
    minHeight: 54,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  input: {
    flex: 1,
    height: 54,
    paddingHorizontal: 11,
    fontSize: 14,
    fontWeight: "500",
  },

  // INFORMATION BOX

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 13,
    borderRadius: 12,
    gap: 9,
    marginTop: 2,
    marginBottom: 23,
  },

  infoText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 18,
  },

  // SAVE BUTTON

  saveButton: {
    height: 55,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  savingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  // CANCEL BUTTON

  cancelButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 11,
  },

  cancelText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // FOOTER

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 23,
  },

  footerText: {
    fontSize: 10,
    fontWeight: "500",
  },

  bottomSpace: {
    height: 20,
  },

});
