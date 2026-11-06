
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import {
  useTheme,
  lightColors,
  darkColors,
} from "@/context/ThemeContext";
import { getCurrentBudgetAlert } from "@/services/budgetService";
import { enableWebPush, disableWebPush } from "@/services/pushService";
import API_URL from "@/services/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const GREEN = "#16A085";
const RED = "#DC2626";

export default function SettingsScreen() {
  const { logout, token } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const loadNotificationPreference = async () => {
      try {
        const saved = await AsyncStorage.getItem("notificationsEnabled");
        setNotificationsEnabled(saved === "true");
      } catch (error) {
        console.error("Unable to load notification preference:", error);
      } finally {
        setNotificationsLoading(false);
      }
    };

    void loadNotificationPreference();
  }, []);

  const checkBudgetAlert = async () => {
    if (!token) return;

    try {
      const result = await getCurrentBudgetAlert(token);

      if (!result.success || !result.has_budget || !result.alert) {
        return;
      }

      const alert = result.alert;
      const monthKey = `${result.budget?.year}-${result.budget?.month}`;
      const alertKey = `budgetAlert_${monthKey}_${alert.level}`;

      const alreadyShown = await AsyncStorage.getItem(alertKey);
      if (alreadyShown === "true") return;

      if (Platform.OS === "web") {
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          window.Notification.permission === "granted"
        ) {
          new window.Notification(alert.title, {
            body: alert.message,
          });
          await AsyncStorage.setItem(alertKey, "true");
        } else {
          Alert.alert(alert.title, alert.message);
        }
        return;
      }

      const permission = await Notifications.getPermissionsAsync();

      if (permission.granted) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: alert.title,
            body: alert.message,
            sound: true,
          },
          trigger: null,
        });

        await AsyncStorage.setItem(alertKey, "true");
      } else {
        Alert.alert(alert.title, alert.message);
      }
    } catch (error) {
      console.error("Budget notification error:", error);
    }
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (notificationsLoading) return;

    if (!token) {
      Alert.alert(
        "Authentication Error",
        "Your login session has expired. Please log in again."
      );
      return;
    }

    try {
      if (enabled && Platform.OS === "web") {
        if (
          typeof window === "undefined" ||
          !("Notification" in window) ||
          !("serviceWorker" in navigator) ||
          !("PushManager" in window)
        ) {
          Alert.alert(
            "Not Supported",
            "This browser does not support web push notifications. Try a current version of Chrome."
          );
          return;
        }

        let permission = window.Notification.permission;

        if (permission === "default") {
          permission = await window.Notification.requestPermission();
        }

        if (permission !== "granted") {
          Alert.alert(
            "Permission Required",
            "Allow notifications in your browser settings, then try again."
          );
          return;
        }

        await enableWebPush(token);
      }

      if (enabled && Platform.OS !== "web") {
        const permission = await Notifications.requestPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permission Required",
            "Allow notifications in your device settings, then try again."
          );
          return;
        }

        await Notifications.setNotificationChannelAsync("budget-alerts", {
          name: "Budget Alerts",
          importance: Notifications.AndroidImportance.HIGH,
          sound: "default",
        });
      }

      if (!enabled && Platform.OS === "web") {
        await disableWebPush(token);
      }

      await AsyncStorage.setItem("notificationsEnabled", String(enabled));
      setNotificationsEnabled(enabled);

      if (enabled) {
        await checkBudgetAlert();

        if (Platform.OS === "web") {
          Alert.alert(
            "Notifications Enabled",
            "This browser has been subscribed to push notifications. We will test delivery next."
          );
        }
      }
    } catch (error) {
      console.error("Notification settings error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to update notification settings. Please try again.";

      Alert.alert("Notification Error", message);
    }
  };

  const openChangePassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordForm(true);
  };

  const closeChangePassword = () => {
    if (changingPassword) return;

    setShowPasswordForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing Information", "Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        "Invalid Password",
        "Your new password must contain at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Passwords Do Not Match",
        "New password and confirmation password must match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        "Invalid Password",
        "Your new password must be different from your current password."
      );
      return;
    }

    if (!token) {
      Alert.alert(
        "Authentication Error",
        "Your login session has expired. Please login again."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Unable to Change Password",
          data.message || "Something went wrong. Please try again."
        );
        return;
      }

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
      console.error("Change password error:", error);

      Alert.alert(
        "Connection Error",
        "Unable to connect to the server. Please check that the backend is running."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await logout();
        router.replace("/login");
      } catch (error) {
        console.error("Settings logout error:", error);

        if (Platform.OS === "web") {
          window.alert("Unable to logout. Please try again.");
        } else {
          Alert.alert("Logout Error", "Unable to logout. Please try again.");
        }
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to logout?");
      if (confirmed) await performLogout();
      return;
    }

    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            void performLogout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const SectionHeading = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, { color: colors.text }]}>
      {title}
    </Text>
  );

  const PasswordField = ({
    label,
    value,
    onChangeText,
    placeholder,
    visible,
    onToggleVisibility,
  }: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    visible: boolean;
    onToggleVisibility: () => void;
  }) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>
        {label}
      </Text>

      <View
        style={[
          styles.passwordInputContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          style={[styles.passwordInput, { color: colors.text }]}
        />

        <Pressable
          onPress={onToggleVisibility}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
        >
          <MaterialCommunityIcons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={21}
            color={colors.secondaryText}
          />
        </Pressable>
      </View>
    </View>
  );

  const SettingRow = ({
    icon,
    iconColor,
    title,
    description,
    onPress,
    showArrow = true,
  }: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    iconColor: string;
    title: string;
    description: string;
    onPress: () => void;
    showArrow?: boolean;
  }) => (
    <Pressable
      style={styles.settingRow}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.settingIcon,
          { backgroundColor: `${iconColor}18` },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
      </View>

      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text
          style={[styles.settingDescription, { color: colors.secondaryText }]}
        >
          {description}
        </Text>
      </View>

      {showArrow && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={23}
          color={colors.secondaryText}
        />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Settings
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>
              Manage your app preferences
            </Text>
          </View>

          <View style={{ width: 42 }} />
        </View>

        {/* PREFERENCES */}
        <SectionHeading title="Preferences" />

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: "#16A08518" }]}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={22}
                color={GREEN}
              />
            </View>

            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Notifications
              </Text>
              <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
                Receive reminders and important updates
              </Text>
            </View>

            {notificationsLoading ? (
              <ActivityIndicator size="small" color={GREEN} />
            ) : (
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                disabled={notificationsLoading}
                trackColor={{ false: "#A0A0A0", true: GREEN }}
                thumbColor="#FFFFFF"
              />
            )}
          </View>

          <View style={[styles.divider, { borderTopColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: "#64748B18" }]}>
              <MaterialCommunityIcons
                name={isDarkMode ? "moon-waning-crescent" : "white-balance-sunny"}
                size={22}
                color={isDarkMode ? "#A78BFA" : "#E6A23C"}
              />
            </View>

            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Dark Mode
              </Text>
              <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
                Use a darker appearance throughout the app
              </Text>
            </View>

            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#A0A0A0", true: GREEN }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ACCOUNT */}
        <SectionHeading title="Account" />

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <SettingRow
            icon="account-edit-outline"
            iconColor={GREEN}
            title="Edit Profile"
            description="Update your personal information"
            onPress={() => router.push("/edit-profile")}
          />

          <View style={[styles.divider, { borderTopColor: colors.border }]} />

          <SettingRow
            icon="lock-reset"
            iconColor="#E6A23C"
            title="Change Password"
            description="Keep your account secure"
            onPress={openChangePassword}
          />
        </View>

        {/* CHANGE PASSWORD FORM */}
        {showPasswordForm && (
          <View
            style={[
              styles.passwordCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.passwordHeader}>
              <View style={styles.passwordHeadingIcon}>
                <MaterialCommunityIcons
                  name="shield-lock-outline"
                  size={24}
                  color={GREEN}
                />
              </View>

              <View style={styles.passwordHeadingText}>
                <Text style={[styles.passwordTitle, { color: colors.text }]}>
                  Change Password
                </Text>
                <Text style={[styles.passwordSubtitle, { color: colors.secondaryText }]}>
                  Choose a strong password for your account.
                </Text>
              </View>

              <Pressable
                onPress={closeChangePassword}
                disabled={changingPassword}
                hitSlop={10}
              >
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={24}
                  color={colors.secondaryText}
                />
              </Pressable>
            </View>

            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              visible={showCurrentPassword}
              onToggleVisibility={() => setShowCurrentPassword(!showCurrentPassword)}
            />

            <PasswordField
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              visible={showNewPassword}
              onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
            />

            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              visible={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <View style={styles.passwordHint}>
              <MaterialCommunityIcons
                name="information-outline"
                size={17}
                color={GREEN}
              />
              <Text style={[styles.passwordHintText, { color: colors.secondaryText }]}>
                Your new password must contain at least 6 characters.
              </Text>
            </View>

            <View style={styles.passwordButtons}>
              <Pressable
                style={[
                  styles.cancelButton,
                  { borderColor: colors.border, backgroundColor: colors.inputBackground },
                ]}
                onPress={closeChangePassword}
                disabled={changingPassword}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.changeButton,
                  { backgroundColor: GREEN },
                  changingPassword && styles.disabledButton,
                ]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="lock-check-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.changeButtonText}>Update Password</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* ABOUT */}
        <SectionHeading title="About" />

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.aboutRow}>
            <View style={styles.aboutLogo}>
              <MaterialCommunityIcons
                name="wallet-outline"
                size={27}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Student Expense Tracker
              </Text>
              <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
                Manage your income, expenses and budgets in one place.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { borderTopColor: colors.border }]} />

          <View style={styles.versionRow}>
            <View style={styles.versionLeft}>
              <MaterialCommunityIcons
                name="information-outline"
                size={18}
                color={colors.secondaryText}
              />
              <Text style={[styles.versionLabel, { color: colors.secondaryText }]}>
                App Version
              </Text>
            </View>

            <Text style={[styles.versionText, { color: colors.text }]}>
              1.0.0
            </Text>
          </View>
        </View>

        {/* LOGOUT */}
        <Pressable
          style={[
            styles.logoutButton,
            {
              backgroundColor: colors.card,
              borderColor: isDarkMode ? "#7F1D1D" : "#FECACA",
            },
          ]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons
            name="logout"
            size={20}
            color={RED}
          />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <Text style={[styles.footerText, { color: colors.secondaryText }]}>
          Student Expense Tracker • Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 45,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    borderRadius: 19,
    borderWidth: 1,
    marginBottom: 24,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 17,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  settingDescription: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  divider: {
    borderTopWidth: 1,
    marginLeft: 16,
  },
  settingRowPressable: {
    flexDirection: "row",
    alignItems: "center",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  passwordCard: {
    borderRadius: 19,
    borderWidth: 1,
    padding: 17,
    marginBottom: 24,
  },
  passwordHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  passwordHeadingIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#16A08518",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },
  passwordHeadingText: {
    flex: 1,
  },
  passwordTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  passwordSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  fieldGroup: {
    marginTop: 13,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
  },
  passwordInputContainer: {
    minHeight: 51,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 11,
  },
  passwordHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    gap: 7,
  },
  passwordHintText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  passwordButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 0.8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  changeButton: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },
  changeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.7,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 17,
  },
  aboutLogo: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },
  versionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 17,
    paddingVertical: 15,
  },
  versionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  versionLabel: {
    fontSize: 12,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "800",
  },
  logoutButton: {
    height: 53,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    marginTop: 2,
  },
  logoutText: {
    color: RED,
    fontSize: 14,
    fontWeight: "800",
  },
  footerText: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 22,
  },
});
