import React from "react";

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import { useAuth } from "@/context/AuthContext";

import { useTheme } from "@/context/ThemeContext";


// =====================================================
// PROFILE SCREEN
// =====================================================

export default function ProfileScreen() {

  // ===================================================
  // AUTH
  // ===================================================

  const {
    user,
    logout,
  } = useAuth();


  // ===================================================
  // THEME
  // ===================================================

  const {
    colors,
    isDarkMode,
  } = useTheme();


  // ===================================================
  // USER DATA
  // ===================================================

  const fullName =
    user?.full_name || "Student";

  const email =
    user?.email || "No email available";

  const phone =
    user?.phone || "Not provided";


  // ===================================================
  // USER INITIAL
  // ===================================================

  const userInitial =
    fullName
      .trim()
      .charAt(0)
      .toUpperCase() || "S";


  // ===================================================
  // LOGOUT
  // ===================================================

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

              console.error(
                "Logout error:",
                error
              );

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
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View
          style={styles.header}
        >

          <Pressable
            style={[
              styles.backButton,
              {
                backgroundColor:
                  colors.card,

                borderColor:
                  colors.border,
              },
            ]}
            onPress={() =>
              router.back()
            }
          >

            <Text
              style={[
                styles.backButtonText,
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
              styles.headerTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Profile
          </Text>


          <View
            style={
              styles.headerSpace
            }
          />

        </View>


        {/* =================================================
            PROFILE CARD
        ================================================= */}

        <View
          style={[
            styles.profileCard,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,
            },
          ]}
        >

          <View
            style={[
              styles.profileCircle,
              {
                backgroundColor:
                  colors.primary,
              },
            ]}
          >

            <Text
              style={
                styles.profileInitial
              }
            >
              {userInitial}
            </Text>

          </View>


          <Text
            style={[
              styles.profileName,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {fullName}
          </Text>


          <Text
            style={[
              styles.profileEmail,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            {email}
          </Text>

        </View>


        {/* =================================================
            PERSONAL INFORMATION
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
          Personal Information
        </Text>


        <View
          style={[
            styles.infoCard,
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

          <View
            style={[
              styles.infoRow,
              {
                borderBottomColor:
                  colors.border,
              },
            ]}
          >

            <View
              style={[
                styles.infoIcon,
                {
                  backgroundColor:
                    colors.iconBackground,
                },
              ]}
            >

              <Text
                style={
                  styles.iconText
                }
              >
                👤
              </Text>

            </View>


            <View
              style={
                styles.infoContent
              }
            >

              <Text
                style={[
                  styles.infoLabel,
                  {
                    color:
                      colors.mutedText,
                  },
                ]}
              >
                Full Name
              </Text>


              <Text
                style={[
                  styles.infoValue,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {fullName}
              </Text>

            </View>

          </View>


          {/* =================================================
              EMAIL
          ================================================= */}

          <View
            style={[
              styles.infoRow,
              {
                borderBottomColor:
                  colors.border,
              },
            ]}
          >

            <View
              style={[
                styles.infoIcon,
                {
                  backgroundColor:
                    colors.iconBackground,
                },
              ]}
            >

              <Text
                style={
                  styles.iconText
                }
              >
                ✉️
              </Text>

            </View>


            <View
              style={
                styles.infoContent
              }
            >

              <Text
                style={[
                  styles.infoLabel,
                  {
                    color:
                      colors.mutedText,
                  },
                ]}
              >
                Email Address
              </Text>


              <Text
                style={[
                  styles.infoValue,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {email}
              </Text>

            </View>

          </View>


          {/* =================================================
              PHONE
          ================================================= */}

          <View
            style={[
              styles.infoRow,
              styles.lastInfoRow,
            ]}
          >

            <View
              style={[
                styles.infoIcon,
                {
                  backgroundColor:
                    colors.iconBackground,
                },
              ]}
            >

              <Text
                style={
                  styles.iconText
                }
              >
                📱
              </Text>

            </View>


            <View
              style={
                styles.infoContent
              }
            >

              <Text
                style={[
                  styles.infoLabel,
                  {
                    color:
                      colors.mutedText,
                  },
                ]}
              >
                Phone Number
              </Text>


              <Text
                style={[
                  styles.infoValue,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {phone}
              </Text>

            </View>

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
            styles.accountCard,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,
            },
          ]}
        >

          {/* =================================================
              EDIT PROFILE
          ================================================= */}

          <Pressable
            style={[
              styles.accountRow,
              {
                borderBottomColor:
                  colors.border,
              },
            ]}
            onPress={() =>
              router.push(
                "/edit-profile"
              )
            }
          >

            <View
              style={[
                styles.accountIcon,
                {
                  backgroundColor:
                    isDarkMode
                      ? "#1E3A5F"
                      : "#EFF6FF",
                },
              ]}
            >

              <Text
                style={
                  styles.iconText
                }
              >
                ✏️
              </Text>

            </View>


            <View
              style={
                styles.accountContent
              }
            >

              <Text
                style={[
                  styles.accountTitle,
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
                  styles.accountDescription,
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
                    colors.primary,
                },
              ]}
            >
              ›
            </Text>

          </Pressable>


          {/* =================================================
              SETTINGS
          ================================================= */}

          <Pressable
            style={[
              styles.accountRow,
              styles.lastAccountRow,
            ]}
            onPress={() =>
              router.push(
                "/settings"
              )
            }
          >

            <View
              style={[
                styles.accountIcon,
                {
                  backgroundColor:
                    isDarkMode
                      ? "#1E3A5F"
                      : "#EFF6FF",
                },
              ]}
            >

              <Text
                style={
                  styles.iconText
                }
              >
                ⚙️
              </Text>

            </View>


            <View
              style={
                styles.accountContent
              }
            >

              <Text
                style={[
                  styles.accountTitle,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                Settings
              </Text>


              <Text
                style={[
                  styles.accountDescription,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                Manage your app preferences
              </Text>

            </View>


            <Text
              style={[
                styles.arrow,
                {
                  color:
                    colors.primary,
                },
              ]}
            >
              ›
            </Text>

          </Pressable>

        </View>


        {/* =================================================
            LOGOUT
        ================================================= */}

        <Pressable
          style={[
            styles.logoutButton,
            {
              backgroundColor:
                isDarkMode
                  ? "#3F1D1D"
                  : "#FEF2F2",

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
            style={[
              styles.logoutText,
              {
                color:
                  colors.danger,
              },
            ]}
          >
            Logout
          </Text>

        </Pressable>


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
    marginBottom: 24,
  },


  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },


  backButtonText: {
    fontSize: 38,
    lineHeight: 38,
  },


  headerTitle: {
    fontSize: 23,
    fontWeight: "800",
  },


  headerSpace: {
    width: 40,
  },


  // ===================================================
  // PROFILE CARD
  // ===================================================

  profileCard: {
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 28,
  },


  profileCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },


  profileInitial: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800",
  },


  profileName: {
    fontSize: 22,
    fontWeight: "800",
  },


  profileEmail: {
    fontSize: 14,
    marginTop: 5,
  },


  // ===================================================
  // SECTION
  // ===================================================

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 12,
  },


  // ===================================================
  // INFORMATION
  // ===================================================

  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 28,
  },


  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },


  lastInfoRow: {
    borderBottomWidth: 0,
  },


  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },


  iconText: {
    fontSize: 19,
  },


  infoContent: {
    flex: 1,
  },


  infoLabel: {
    fontSize: 12,
    marginBottom: 3,
  },


  infoValue: {
    fontSize: 15,
    fontWeight: "600",
  },


  // ===================================================
  // ACCOUNT
  // ===================================================

  accountCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 22,
    overflow: "hidden",
  },


  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },


  lastAccountRow: {
    borderBottomWidth: 0,
  },


  accountIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },


  accountContent: {
    flex: 1,
  },


  accountTitle: {
    fontSize: 15,
    fontWeight: "700",
  },


  accountDescription: {
    fontSize: 12,
    marginTop: 3,
  },


  arrow: {
    fontSize: 28,
  },


  // ===================================================
  // LOGOUT
  // ===================================================

  logoutButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },


  logoutText: {
    fontSize: 15,
    fontWeight: "700",
  },


  // ===================================================
  // BOTTOM SPACE
  // ===================================================

  bottomSpace: {
    height: 20,
  },

});

