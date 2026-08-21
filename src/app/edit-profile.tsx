
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
} from "expo-router";

import {
  useAuth,
} from "@/context/AuthContext";

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

  const {
    isDarkMode,
  } = useTheme();


  const colors =
    isDarkMode
      ? darkColors
      : lightColors;


  // ===================================================
  // FORM DATA
  // ===================================================

  const [fullName, setFullName] =
    useState(
      user?.full_name || ""
    );

  const [email, setEmail] =
    useState(
      user?.email || ""
    );

  const [phone, setPhone] =
    useState(
      user?.phone || ""
    );


  // ===================================================
  // SAVING STATE
  // ===================================================

  const [saving, setSaving] =
    useState(false);


  // ===================================================
  // UPDATE FORM WHEN USER DATA CHANGES
  // ===================================================

  useEffect(() => {

    if (!user) {
      return;
    }

    setFullName(
      user.full_name || ""
    );

    setEmail(
      user.email || ""
    );

    setPhone(
      user.phone || ""
    );

  }, [user]);


  // ===================================================
  // SAVE PROFILE
  // ===================================================

  const handleSave = async () => {

    // -----------------------------------------------
    // CHECK LOGIN
    // -----------------------------------------------

    if (!token || !user) {

      Alert.alert(
        "Error",
        "You are not logged in."
      );

      return;
    }


    // -----------------------------------------------
    // VALIDATE FULL NAME
    // -----------------------------------------------

    if (!fullName.trim()) {

      Alert.alert(
        "Required",
        "Please enter your full name."
      );

      return;
    }


    // -----------------------------------------------
    // VALIDATE EMAIL
    // -----------------------------------------------

    if (!email.trim()) {

      Alert.alert(
        "Required",
        "Please enter your email."
      );

      return;
    }


    // -----------------------------------------------
    // VALIDATE EMAIL FORMAT
    // -----------------------------------------------

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailRegex.test(email.trim())) {

      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );

      return;
    }


    // -----------------------------------------------
    // SAVE
    // -----------------------------------------------

    try {

      setSaving(true);


      await updateProfile({

        full_name:
          fullName.trim(),

        email:
          email.trim(),

        phone:
          phone.trim(),

      });


      // ---------------------------------------------
      // SUCCESS
      // ---------------------------------------------

      Alert.alert(
        "Success",
        "Your profile has been updated successfully.",
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
        keyboardShouldPersistTaps="handled"
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View
          style={styles.header}
        >

          {/* BACK BUTTON */}

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
                    colors.primary,
                },
              ]}
            >
              ‹
            </Text>

          </Pressable>


          {/* TITLE */}

          <Text
            style={[
              styles.headerTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Edit Profile
          </Text>


          {/* SPACER */}

          <View
            style={
              styles.headerSpacer
            }
          />

        </View>


        {/* =================================================
            PROFILE AVATAR
        ================================================= */}

        <View
          style={
            styles.avatarContainer
          }
        >

          <View
            style={[
              styles.avatar,
              {
                backgroundColor:
                  colors.primary,
              },
            ]}
          >

            <Text
              style={
                styles.avatarText
              }
            >

              {fullName
                ? fullName
                    .trim()
                    .charAt(0)
                    .toUpperCase()
                : "S"}

            </Text>

          </View>


          <Text
            style={[
              styles.avatarName,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {fullName || "Student"}
          </Text>

        </View>


        {/* =================================================
            FORM
        ================================================= */}

        <View
          style={[
            styles.form,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,
            },
          ]}
        >

          {/* =================================================
              FULL NAME
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
            Full Name
          </Text>


          <TextInput
            style={[
              styles.input,
              {
                color:
                  colors.text,

                backgroundColor:
                  colors.inputBackground,

                borderColor:
                  colors.border,
              },
            ]}
            value={fullName}
            onChangeText={
              setFullName
            }
            placeholder="Enter your full name"
            placeholderTextColor={
              colors.mutedText
            }
            autoCapitalize="words"
            autoCorrect={false}
          />


          {/* =================================================
              EMAIL
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
            Email
          </Text>


          <TextInput
            style={[
              styles.input,
              {
                color:
                  colors.text,

                backgroundColor:
                  colors.inputBackground,

                borderColor:
                  colors.border,
              },
            ]}
            value={email}
            onChangeText={
              setEmail
            }
            placeholder="Enter your email"
            placeholderTextColor={
              colors.mutedText
            }
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />


          {/* =================================================
              PHONE
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
            Phone
          </Text>


          <TextInput
            style={[
              styles.input,
              {
                color:
                  colors.text,

                backgroundColor:
                  colors.inputBackground,

                borderColor:
                  colors.border,
              },
            ]}
            value={phone}
            onChangeText={
              setPhone
            }
            placeholder="Enter your phone number"
            placeholderTextColor={
              colors.mutedText
            }
            keyboardType="phone-pad"
          />


          {/* =================================================
              SAVE BUTTON
          ================================================= */}

          <Pressable
            style={[
              styles.saveButton,
              {
                backgroundColor:
                  colors.primary,
              },

              saving &&
                styles.saveButtonDisabled,
            ]}
            onPress={
              handleSave
            }
            disabled={saving}
          >

            {saving ? (

              <ActivityIndicator
                color={
                  colors.white
                }
              />

            ) : (

              <Text
                style={
                  styles.saveButtonText
                }
              >
                Save Changes
              </Text>

            )}

          </Pressable>


          {/* =================================================
              CANCEL BUTTON
          ================================================= */}

          <Pressable
            style={
              styles.cancelButton
            }
            onPress={() =>
              router.back()
            }
            disabled={saving}
          >

            <Text
              style={[
                styles.cancelText,
                {
                  color:
                    colors.danger,
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
    fontWeight: "500",
  },


  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },


  headerSpacer: {
    width: 42,
  },


  // ===================================================
  // AVATAR
  // ===================================================

  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },


  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },


  avatarText: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
  },


  avatarName: {
    fontSize: 17,
    fontWeight: "700",
  },


  // ===================================================
  // FORM
  // ===================================================

  form: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
  },


  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 7,
    marginTop: 14,
  },


  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
  },


  // ===================================================
  // SAVE BUTTON
  // ===================================================

  saveButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },


  saveButtonDisabled: {
    opacity: 0.7,
  },


  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },


  // ===================================================
  // CANCEL
  // ===================================================

  cancelButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },


  cancelText: {
    fontSize: 14,
    fontWeight: "600",
  },


  // ===================================================
  // BOTTOM SPACE
  // ===================================================

  bottomSpace: {
    height: 20,
  },

});
