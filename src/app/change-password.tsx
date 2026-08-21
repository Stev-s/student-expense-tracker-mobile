import React, {
  useState,
} from "react";

import {
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
} from "expo-router";

import {
  useAuth,
} from "@/context/AuthContext";

import {
  useTheme,
} from "@/context/ThemeContext";


// =====================================================
// CHANGE PASSWORD SCREEN
// =====================================================

export default function ChangePasswordScreen() {

  const {
    changePassword,
  } = useAuth();


  const {
    colors,
  } = useTheme();


  // ===================================================
  // FORM STATE
  // ===================================================

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
    saving,
    setSaving,
  ] = useState(false);


  // ===================================================
  // CHANGE PASSWORD
  // ===================================================

  const handleChangePassword = async () => {

    // -----------------------------------------------
    // EMPTY FIELDS
    // -----------------------------------------------

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


    // -----------------------------------------------
    // NEW PASSWORD LENGTH
    // -----------------------------------------------

    if (
      newPassword.length < 6
    ) {

      Alert.alert(
        "Invalid Password",
        "New password must contain at least 6 characters."
      );

      return;

    }


    // -----------------------------------------------
    // CONFIRM PASSWORD
    // -----------------------------------------------

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


    // -----------------------------------------------
    // PREVENT SAME PASSWORD
    // -----------------------------------------------

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


    try {

      setSaving(true);


      await changePassword(
        currentPassword,
        newPassword
      );


      // ---------------------------------------------
      // SUCCESS
      // ---------------------------------------------

      Alert.alert(
        "Success",
        "Your password has been changed successfully.",
        [
          {
            text: "OK",

            onPress: () => {

              router.back();

            },

          },
        ]
      );


      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");


    } catch (error: any) {

      Alert.alert(
        "Unable to Change Password",
        error?.message ||
        "Something went wrong. Please try again."
      );

    } finally {

      setSaving(false);

    }

  };


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
            Change Password
          </Text>


          <View
            style={
              styles.headerSpacer
            }
          />

        </View>


        {/* =================================================
            DESCRIPTION
        ================================================= */}

        <Text
          style={[
            styles.description,
            {
              color:
                colors.secondaryText,
            },
          ]}
        >
          Update your password to keep your account secure.
        </Text>


        {/* =================================================
            FORM CARD
        ================================================= */}

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

          {/* CURRENT PASSWORD */}

          <Text
            style={[
              styles.label,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Current Password
          </Text>


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
            secureTextEntry
            autoCapitalize="none"
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
          />


          {/* NEW PASSWORD */}

          <Text
            style={[
              styles.label,
              {
                color:
                  colors.text,
              },
            ]}
          >
            New Password
          </Text>


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
            secureTextEntry
            autoCapitalize="none"
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
          />


          {/* CONFIRM PASSWORD */}

          <Text
            style={[
              styles.label,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Confirm New Password
          </Text>


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
            secureTextEntry
            autoCapitalize="none"
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
          />


          {/* PASSWORD REQUIREMENT */}

          <Text
            style={[
              styles.requirement,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            Password must contain at least 6 characters.
          </Text>


          {/* SAVE BUTTON */}

          <Pressable
            disabled={saving}
            onPress={
              handleChangePassword
            }
            style={[
              styles.saveButton,
              {
                backgroundColor:
                  colors.primary,
                opacity:
                  saving ? 0.6 : 1,
              },
            ]}
          >

            <Text
              style={
                styles.saveButtonText
              }
            >
              {saving
                ? "Changing Password..."
                : "Change Password"}
            </Text>

          </Pressable>


          {/* CANCEL */}

          <Pressable
            disabled={saving}
            onPress={() =>
              router.back()
            }
            style={[
              styles.cancelButton,
              {
                borderColor:
                  colors.border,
              },
            ]}
          >

            <Text
              style={[
                styles.cancelText,
                {
                  color:
                    colors.text,
                },
              ]}
            >
              Cancel
            </Text>

          </Pressable>

        </View>

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
    marginBottom: 18,
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


  // ===================================================
  // DESCRIPTION
  // ===================================================

  description: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 22,
  },


  // ===================================================
  // CARD
  // ===================================================

  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },


  // ===================================================
  // LABEL
  // ===================================================

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },


  // ===================================================
  // INPUT
  // ===================================================

  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 14,
    marginBottom: 18,
  },


  // ===================================================
  // REQUIREMENT
  // ===================================================

  requirement: {
    fontSize: 12,
    marginTop: -5,
    marginBottom: 20,
    lineHeight: 18,
  },


  // ===================================================
  // SAVE BUTTON
  // ===================================================

  saveButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },


  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },


  // ===================================================
  // CANCEL BUTTON
  // ===================================================

  cancelButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },


  cancelText: {
    fontSize: 15,
    fontWeight: "600",
  },

});