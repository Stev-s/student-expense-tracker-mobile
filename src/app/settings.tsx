import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import { useAuth } from "@/context/AuthContext";

import {
  useTheme,
  lightColors,
  darkColors,
} from "@/context/ThemeContext";


// =====================================================
// API
// =====================================================

const API_URL = "http://localhost:5000";


// =====================================================
// SETTINGS SCREEN
// =====================================================

export default function SettingsScreen() {

  const {
    logout,
    token,
  } = useAuth();

  const {
    isDarkMode,
    toggleDarkMode,
  } = useTheme();


  const colors =
    isDarkMode
      ? darkColors
      : lightColors;


  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const [
    notificationsEnabled,
    setNotificationsEnabled,
  ] = useState(true);


  // =====================================================
  // PASSWORD FORM
  // =====================================================

  const [
    showPasswordForm,
    setShowPasswordForm,
  ] = useState(false);

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    changingPassword,
    setChangingPassword,
  ] = useState(false);


  // =====================================================
  // OPEN CHANGE PASSWORD
  // =====================================================

  const openChangePassword = () => {

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setShowPasswordForm(true);

  };


  // =====================================================
  // CLOSE CHANGE PASSWORD
  // =====================================================

  const closeChangePassword = () => {

    if (changingPassword) {
      return;
    }

    setShowPasswordForm(false);

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

  };


  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handleChangePassword = async () => {

    // ---------------------------------------------------
    // REQUIRED FIELDS
    // ---------------------------------------------------

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {

      Alert.alert(
        "Missing Information",
        "Please fill in all password fields."
      );

      return;

    }


    // ---------------------------------------------------
    // PASSWORD LENGTH
    // ---------------------------------------------------

    if (newPassword.length < 6) {

      Alert.alert(
        "Invalid Password",
        "Your new password must contain at least 6 characters."
      );

      return;

    }


    // ---------------------------------------------------
    // PASSWORD MATCH
    // ---------------------------------------------------

    if (
      newPassword !==
      confirmPassword
    ) {

      Alert.alert(
        "Passwords Do Not Match",
        "New password and confirmation password must match."
      );

      return;

    }


    // ---------------------------------------------------
    // PREVENT SAME PASSWORD
    // ---------------------------------------------------

    if (
      currentPassword ===
      newPassword
    ) {

      Alert.alert(
        "Invalid Password",
        "Your new password must be different from your current password."
      );

      return;

    }


    // ---------------------------------------------------
    // CHECK TOKEN
    // ---------------------------------------------------

    if (!token) {

      Alert.alert(
        "Authentication Error",
        "Your login session has expired. Please login again."
      );

      return;

    }


    try {

      setChangingPassword(true);


      // =================================================
      // SEND REQUEST TO BACKEND
      // =================================================

      const response =
        await fetch(
          `${API_URL}/api/auth/change-password`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({

              currentPassword:
                currentPassword,

              newPassword:
                newPassword,

            }),

          }
        );


      const data =
        await response.json();


      // =================================================
      // SERVER ERROR
      // =================================================

      if (!response.ok) {

        Alert.alert(
          "Unable to Change Password",
          data.message ||
            "Something went wrong. Please try again."
        );

        return;

      }


      // =================================================
      // SUCCESS
      // =================================================

      Alert.alert(
        "Password Changed",
        "Your password has been changed successfully.",
        [
          {
            text: "OK",
            onPress: () => {

              setShowPasswordForm(false);

              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");

            },
          },
        ]
      );

    } catch (error) {

      console.error(
        "Change password error:",
        error
      );

      Alert.alert(
        "Connection Error",
        "Unable to connect to the server. Please check that the backend is running."
      );

    } finally {

      setChangingPassword(false);

    }

  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {

    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Logout",
          style: "destructive",

          onPress: async () => {

            try {

              await logout();

            } catch (error) {

              Alert.alert(
                "Error",
                "Unable to logout. Please try again."
              );

            }

          },

        },

      ]
    );

  };


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
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}

        <View style={styles.header}>

          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backButton,
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
                styles.backText,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              ‹
            </Text>

          </Pressable>


          <Text
            style={[
              styles.headerTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Settings
          </Text>


          <View
            style={styles.headerSpacer}
          />

        </View>


        {/* =================================================
            PREFERENCES
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
          Preferences
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

          {/* NOTIFICATIONS */}

          <View
            style={styles.settingRow}
          >

            <View
              style={[
                styles.settingIcon,
                {
                  backgroundColor:
                    colors.iconBackground,
                },
              ]}
            >
              <Text style={styles.iconText}>
                🔔
              </Text>
            </View>


            <View
              style={styles.settingContent}
            >

              <Text
                style={[
                  styles.settingTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Notifications
              </Text>

              <Text
                style={[
                  styles.settingDescription,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                Receive reminders and important updates
              </Text>

            </View>


            <Switch
              value={
                notificationsEnabled
              }
              onValueChange={
                setNotificationsEnabled
              }
              trackColor={{
                false: "#767577",
                true: colors.primary,
              }}
            />

          </View>


          {/* DARK MODE */}

          <View
            style={[
              styles.settingRow,
              styles.divider,
              {
                borderTopColor:
                  colors.border,
              },
            ]}
          >

            <View
              style={[
                styles.settingIcon,
                {
                  backgroundColor:
                    colors.iconBackground,
                },
              ]}
            >
              <Text style={styles.iconText}>
                {isDarkMode ? "🌙" : "☀️"}
              </Text>
            </View>


            <View
              style={styles.settingContent}
            >

              <Text
                style={[
                  styles.settingTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Dark Mode
              </Text>

              <Text
                style={[
                  styles.settingDescription,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                Use a darker appearance throughout the app
              </Text>

            </View>


            <Switch
              value={isDarkMode}
              onValueChange={
                toggleDarkMode
              }
              trackColor={{
                false: "#767577",
                true: colors.primary,
              }}
            />

          </View>

        </View>


        {/* =================================================
            ACCOUNT
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
          Account
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

          {/* EDIT PROFILE */}

          <Pressable
            style={styles.accountRow}
            onPress={() =>
              router.push(
                "/edit-profile"
              )
            }
          >

            <View
              style={[
                styles.settingIcon,
                {
                  backgroundColor:
                    colors.iconBackground,
                },
              ]}
            >
              <Text style={styles.iconText}>
                ✏️
              </Text>
            </View>


            <View
              style={styles.settingContent}
            >

              <Text
                style={[
                  styles.settingTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Edit Profile
              </Text>

              <Text
                style={[
                  styles.settingDescription,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                Update your personal information
              </Text>

            </View>


            <Text
              style={[
                styles.arrow,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              ›
            </Text>

          </Pressable>


          {/* CHANGE PASSWORD */}

          <Pressable
            style={[
              styles.accountRow,
              styles.divider,
              {
                borderTopColor:
                  colors.border,
              },
            ]}
            onPress={
              openChangePassword
            }
          >

            <View
              style={[
                styles.settingIcon,
                {
                  backgroundColor:
                    colors.iconBackground,
                  },
              ]}
            >
              <Text style={styles.iconText}>
                🔑
              </Text>
            </View>


            <View
              style={styles.settingContent}
            >

              <Text
                style={[
                  styles.settingTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Change Password
              </Text>

              <Text
                style={[
                  styles.settingDescription,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                Change your account password
              </Text>

            </View>


            <Text
              style={[
                styles.arrow,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              ›
            </Text>

          </Pressable>

        </View>


        {/* =================================================
            CHANGE PASSWORD FORM
        ================================================= */}

        {showPasswordForm && (

          <View
            style={[
              styles.passwordCard,
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
                styles.passwordHeader
              }
            >

              <View>

                <Text
                  style={[
                    styles.passwordTitle,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  Change Password
                </Text>

                <Text
                  style={[
                    styles.passwordSubtitle,
                    {
                      color:
                        colors.secondaryText,
                    },
                  ]}
                >
                  Enter your current password and choose a new one.
                </Text>

              </View>


              <Pressable
                onPress={
                  closeChangePassword
                }
              >

                <Text
                  style={[
                    styles.closeText,
                    {
                      color:
                        colors.secondaryText,
                    },
                  ]}
                >
                  ×
                </Text>

              </Pressable>

            </View>


            {/* CURRENT PASSWORD */}

            <Text
              style={[
                styles.inputLabel,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Current Password
            </Text>


            <View
              style={[
                styles.passwordInputContainer,
                {
                  backgroundColor:
                    colors.inputBackground,
                  borderColor:
                    colors.border,
                },
              ]}
            >

              <TextInput
                value={
                  currentPassword
                }
                onChangeText={
                  setCurrentPassword
                }
                placeholder="Enter current password"
                placeholderTextColor={
                  colors.mutedText
                }
                secureTextEntry={
                  !showCurrentPassword
                }
                style={[
                  styles.passwordInput,
                  {
                    color:
                      colors.text,
                  },
                ]}
              />


              <Pressable
                onPress={() =>
                  setShowCurrentPassword(
                    !showCurrentPassword
                  )
                }
              >

                <Text
                  style={[
                    styles.showText,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  {showCurrentPassword
                    ? "Hide"
                    : "Show"}
                </Text>

              </Pressable>

            </View>


            {/* NEW PASSWORD */}

            <Text
              style={[
                styles.inputLabel,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              New Password
            </Text>


            <View
              style={[
                styles.passwordInputContainer,
                {
                  backgroundColor:
                    colors.inputBackground,
                  borderColor:
                    colors.border,
                },
              ]}
            >

              <TextInput
                value={
                  newPassword
                }
                onChangeText={
                  setNewPassword
                }
                placeholder="Enter new password"
                placeholderTextColor={
                  colors.mutedText
                }
                secureTextEntry={
                  !showNewPassword
                }
                style={[
                  styles.passwordInput,
                  {
                    color:
                      colors.text,
                  },
                ]}
              />


              <Pressable
                onPress={() =>
                  setShowNewPassword(
                    !showNewPassword
                  )
                }
              >

                <Text
                  style={[
                    styles.showText,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  {showNewPassword
                    ? "Hide"
                    : "Show"}
                </Text>

              </Pressable>

            </View>


            {/* CONFIRM PASSWORD */}

            <Text
              style={[
                styles.inputLabel,
                {
                  color:
                    colors.text,
                  },
                ]}
            >
              Confirm New Password
            </Text>


            <View
              style={[
                styles.passwordInputContainer,
                {
                  backgroundColor:
                    colors.inputBackground,
                  borderColor:
                    colors.border,
                },
              ]}
            >

              <TextInput
                value={
                  confirmPassword
                }
                onChangeText={
                  setConfirmPassword
                }
                placeholder="Confirm new password"
                placeholderTextColor={
                  colors.mutedText
                }
                secureTextEntry={
                  !showConfirmPassword
                }
                style={[
                  styles.passwordInput,
                  {
                    color:
                      colors.text,
                  },
                ]}
              />


              <Pressable
                onPress={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >

                <Text
                  style={[
                    styles.showText,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "Show"}
                </Text>

              </Pressable>

            </View>


            {/* BUTTONS */}

            <View
              style={
                styles.passwordButtons
              }
            >

              <Pressable
                style={[
                  styles.cancelButton,
                  {
                    borderColor:
                      colors.border,
                    backgroundColor:
                      colors.card,
                  },
                ]}
                onPress={
                  closeChangePassword
                }
                disabled={
                  changingPassword
                }
              >

                <Text
                  style={[
                    styles.cancelButtonText,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  Cancel
                </Text>

              </Pressable>


              <Pressable
                style={[
                  styles.changeButton,
                  {
                    backgroundColor:
                      colors.primary,
                  },
                ]}
                onPress={
                  handleChangePassword
                }
                disabled={
                  changingPassword
                }
              >

                {changingPassword ? (

                  <ActivityIndicator
                    color="#FFFFFF"
                  />

                ) : (

                  <Text
                    style={
                      styles.changeButtonText
                    }
                  >
                    Change Password
                  </Text>

                )}

              </Pressable>

            </View>

          </View>

        )}


        {/* =================================================
            ABOUT
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
          About
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
              styles.aboutRow
            }
          >

            <View
              style={[
                styles.settingIcon,
                {
                  backgroundColor:
                    colors.iconBackground,
                },
              ]}
            >
              <Text style={styles.iconText}>
                ℹ️
              </Text>
            </View>


            <View
              style={
                styles.settingContent
              }
            >

              <Text
                style={[
                  styles.settingTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Student Expense Tracker
              </Text>

              <Text
                style={[
                  styles.settingDescription,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                Manage your income, expenses and budgets
                in one place.
              </Text>

            </View>

          </View>


          <View
            style={
              styles.versionRow
            }
          >

            <Text
              style={[
                styles.versionLabel,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              Version
            </Text>

            <Text
              style={[
                styles.versionText,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              1.0.0
            </Text>

          </View>

        </View>


        {/* LOGOUT */}

        <Pressable
          style={[
            styles.logoutButton,
            {
              backgroundColor:
                colors.card,
              borderColor:
                isDarkMode
                  ? "#7F1D1D"
                  : "#FECACA",
            },
          ]}
          onPress={
            handleLogout
          }
        >

          <Text
            style={
              styles.logoutText
            }
          >
            Logout
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  backText: {
    fontSize: 32,
    lineHeight: 36,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },

  headerSpacer: {
    width: 42,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
  },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 26,
    overflow: "hidden",
  },

  passwordCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 26,
  },

  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  passwordTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  passwordSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
    maxWidth: 290,
  },

  closeText: {
    fontSize: 30,
    lineHeight: 30,
    marginLeft: 10,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 7,
    marginTop: 10,
  },

  passwordInputContainer: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },

  passwordInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },

  showText: {
    fontSize: 12,
    fontWeight: "700",
  },

  passwordButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  changeButton: {
    flex: 1.3,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  changeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 17,
  },

  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 17,
  },

  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 17,
  },

  divider: {
    borderTopWidth: 1,
  },

  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  iconText: {
    fontSize: 20,
  },

  settingContent: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  settingDescription: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },

  arrow: {
    fontSize: 28,
    marginLeft: 8,
  },

  versionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 17,
    paddingBottom: 17,
  },

  versionLabel: {
    fontSize: 13,
  },

  versionText: {
    fontSize: 13,
    fontWeight: "600",
  },

  logoutButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  logoutText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "700",
  },

});

