
import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getFullImageUrl } from "@/services/api";

// =====================================================
// PROFILE SCREEN
// =====================================================

export default function ProfileScreen() {
  const {
    user,
    logout,
    uploadProfilePicture,
  } = useAuth();

  const { colors, isDarkMode } = useTheme();

  const [uploadingPicture, setUploadingPicture] = useState(false);

  // ===================================================
  // USER INFORMATION
  // ===================================================

  const fullName = user?.full_name || "Student";
  const email = user?.email || "No email available";
  const phone = user?.phone || "Not provided";

  const userInitial =
    fullName.trim().charAt(0).toUpperCase() || "S";

  const profileImage = getFullImageUrl(
    user?.profile_picture
  );

  const accentBackground = isDarkMode ? "#1E3A5F" : "#EAF2FF";
  const greenBackground = isDarkMode ? "#153B35" : "#E7F7F2";
  const redBackground = isDarkMode ? "#3F2025" : "#FEF0F0";

  // ===================================================
  // UPLOAD SELECTED IMAGE
  // ===================================================

  const handleImageUpload = async (imageUri: string) => {
    try {
      setUploadingPicture(true);

      await uploadProfilePicture(imageUri);

      if (Platform.OS === "web") {
        window.alert("Your profile picture has been updated successfully.");
      } else {
        Alert.alert(
          "Success",
          "Your profile picture has been updated successfully."
        );
      }
    } catch (error: any) {
      console.error("Profile picture upload error:", error);

      const message =
        error?.message || "Unable to upload your profile picture.";

      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Upload Failed", message);
      }
    } finally {
      setUploadingPicture(false);
    }
  };

  // ===================================================
  // CHOOSE IMAGE FROM GALLERY
  // ===================================================

  const chooseFromGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        if (Platform.OS === "web") {
          window.alert(
            "Please allow access to your photos to select a profile picture."
          );
        } else {
          Alert.alert(
            "Permission Required",
            "Please allow access to your photos to select a profile picture."
          );
        }

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (!result.canceled && result.assets?.length > 0) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Gallery error:", error);

      if (Platform.OS === "web") {
        window.alert("Unable to open your photo gallery.");
      } else {
        Alert.alert(
          "Error",
          "Unable to open your photo gallery."
        );
      }
    }
  };

  // ===================================================
  // TAKE PHOTO USING CAMERA
  // ===================================================

  const takePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow camera access to take your profile picture."
        );

        return;
      }

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (!result.canceled && result.assets?.length > 0) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera error:", error);

      Alert.alert(
        "Camera Error",
        "Unable to open the camera. Please try again."
      );
    }
  };

  // ===================================================
  // SELECT PROFILE PICTURE OPTION
  // ===================================================

  const handleChangePicture = () => {
    if (uploadingPicture) return;

    if (Platform.OS === "web") {
      void chooseFromGallery();
      return;
    }

    Alert.alert(
      "Profile Picture",
      "Choose how you would like to add your picture.",
      [
        {
          text: "Choose from Gallery",
          onPress: () => {
            void chooseFromGallery();
          },
        },
        {
          text: "Take a Photo",
          onPress: () => {
            void takePhoto();
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await logout();
        router.replace("/login");
      } catch (error) {
        console.error("Logout error:", error);

        if (Platform.OS === "web") {
          window.alert("Unable to logout. Please try again.");
        } else {
          Alert.alert(
            "Logout Error",
            "Unable to logout. Please try again."
          );
        }
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to logout?"
      );

      if (confirmed) {
        await performLogout();
      }

      return;
    }

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
          onPress: () => {
            void performLogout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  // ===================================================
  // INFORMATION ROW
  // ===================================================

  const InfoRow = ({
    icon,
    label,
    value,
    iconColor,
    backgroundColor,
    last = false,
  }: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    value: string;
    iconColor: string;
    backgroundColor: string;
    last?: boolean;
  }) => (
    <View
      style={[
        styles.infoRow,
        !last && {
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
      ]}
    >
      <View
        style={[
          styles.infoIcon,
          { backgroundColor },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={iconColor}
        />
      </View>

      <View style={styles.infoContent}>
        <Text
          style={[
            styles.infoLabel,
            { color: colors.mutedText },
          ]}
        >
          {label}
        </Text>

        <Text
          style={[
            styles.infoValue,
            { color: colors.text },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  // ===================================================
  // ACCOUNT MENU ROW
  // ===================================================

  const AccountRow = ({
    icon,
    title,
    description,
    onPress,
    iconColor,
    backgroundColor,
    last = false,
  }: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    title: string;
    description: string;
    onPress: () => void;
    iconColor: string;
    backgroundColor: string;
    last?: boolean;
  }) => (
    <Pressable
      style={[
        styles.accountRow,
        !last && {
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.accountIcon,
          { backgroundColor },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={iconColor}
        />
      </View>

      <View style={styles.accountContent}>
        <Text
          style={[
            styles.accountTitle,
            { color: colors.text },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.accountDescription,
            { color: colors.secondaryText },
          ]}
        >
          {description}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={25}
        color={colors.secondaryText}
      />
    </Pressable>
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
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            style={[
              styles.backButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text
              style={[
                styles.headerTitle,
                { color: colors.text },
              ]}
            >
              My Profile
            </Text>

            <Text
              style={[
                styles.headerSubtitle,
                { color: colors.secondaryText },
              ]}
            >
              Manage your personal account
            </Text>
          </View>

          <View style={styles.headerPlaceholder} />
        </View>

        {/* PROFILE CARD */}

        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.primary },
          ]}
        >
          <View style={styles.profileTop}>

            {/* PROFILE IMAGE */}

            <View style={styles.avatarWrapper}>
              <Pressable
                style={styles.avatarContainer}
                onPress={handleChangePicture}
                disabled={uploadingPicture}
              >
                {uploadingPicture ? (
                  <ActivityIndicator
                    size="large"
                    color="#FFFFFF"
                  />
                ) : profileImage ? (
                  <Image
                    key={profileImage}
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.profileInitial}>
                    {userInitial}
                  </Text>
                )}
              </Pressable>

              {/* CAMERA BUTTON */}

              <Pressable
                style={styles.cameraButton}
                onPress={handleChangePicture}
                disabled={uploadingPicture}
              >
                <MaterialCommunityIcons
                  name="camera"
                  size={17}
                  color="#FFFFFF"
                />
              </Pressable>

              <View style={styles.onlineIndicator} />
            </View>

            <View style={styles.profileTextContainer}>
              <Text style={styles.profileGreeting}>
                STUDENT ACCOUNT
              </Text>

              <Text style={styles.profileName}>
                {fullName}
              </Text>

              <Text style={styles.profileEmail}>
                {email}
              </Text>

              <Pressable
                style={styles.changePictureButton}
                onPress={handleChangePicture}
                disabled={uploadingPicture}
              >
                {uploadingPicture ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="image-edit-outline"
                      size={15}
                      color="#FFFFFF"
                    />

                    <Text style={styles.changePictureText}>
                      Change photo
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.profileDivider} />

          <View style={styles.profileFooter}>
            <View style={styles.profileFooterItem}>
              <MaterialCommunityIcons
                name="shield-check"
                size={17}
                color="#D9F7ED"
              />

              <Text style={styles.profileFooterText}>
                Personal account
              </Text>
            </View>

            <Pressable
              style={styles.editQuickButton}
              onPress={() => router.push("/edit-profile")}
            >
              <Text style={styles.editQuickText}>
                Edit
              </Text>

              <MaterialCommunityIcons
                name="pencil"
                size={14}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        </View>

        {/* PERSONAL INFORMATION */}

        <View style={styles.sectionHeader}>
          <View>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text },
              ]}
            >
              Personal Information
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                { color: colors.secondaryText },
              ]}
            >
              Your registered details
            </Text>
          </View>

          <MaterialCommunityIcons
            name="account-details-outline"
            size={23}
            color={colors.primary}
          />
        </View>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <InfoRow
            icon="account-outline"
            label="Full Name"
            value={fullName}
            iconColor={colors.primary}
            backgroundColor={accentBackground}
          />

          <InfoRow
            icon="email-outline"
            label="Email Address"
            value={email}
            iconColor="#16A085"
            backgroundColor={greenBackground}
          />

          <InfoRow
            icon="phone-outline"
            label="Phone Number"
            value={phone}
            iconColor="#E76F51"
            backgroundColor={redBackground}
            last
          />
        </View>

        {/* ACCOUNT SETTINGS */}

        <View style={styles.sectionHeader}>
          <View>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text },
              ]}
            >
              Account
            </Text>

            <Text
              style={[
                styles.sectionSubtitle,
                { color: colors.secondaryText },
              ]}
            >
              Manage your account and preferences
            </Text>
          </View>

          <MaterialCommunityIcons
            name="cog-outline"
            size={23}
            color={colors.primary}
          />
        </View>

        <View
          style={[
            styles.accountCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <AccountRow
            icon="account-edit-outline"
            title="Edit Profile"
            description="Update your personal information"
            onPress={() => router.push("/edit-profile")}
            iconColor={colors.primary}
            backgroundColor={accentBackground}
          />

          <AccountRow
            icon="cog-outline"
            title="Settings"
            description="Manage your app preferences"
            onPress={() => router.push("/settings")}
            iconColor="#16A085"
            backgroundColor={greenBackground}
            last
          />
        </View>

        {/* LOGOUT */}

        <Pressable
          style={[
            styles.logoutButton,
            {
              backgroundColor: redBackground,
              borderColor: isDarkMode ? "#71333A" : "#FECACA",
            },
          ]}
          onPress={handleLogout}
        >
          <View style={styles.logoutIcon}>
            <MaterialCommunityIcons
              name="logout"
              size={20}
              color={colors.danger}
            />
          </View>

          <Text
            style={[
              styles.logoutText,
              { color: colors.danger },
            ]}
          >
            Logout
          </Text>

          <View style={styles.logoutSpacer} />

          <MaterialCommunityIcons
            name="chevron-right"
            size={23}
            color={colors.danger}
          />
        </Pressable>

        {/* FOOTER */}

        <View style={styles.footer}>
          <MaterialCommunityIcons
            name="wallet-outline"
            size={20}
            color={colors.secondaryText}
          />

          <Text
            style={[
              styles.footerText,
              { color: colors.secondaryText },
            ]}
          >
            Student Expense Tracker
          </Text>
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
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitleContainer: {
    flex: 1,
    marginLeft: 14,
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: "800",
  },

  headerSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  headerPlaceholder: {
    width: 12,
  },

  // PROFILE CARD

  profileCard: {
    borderRadius: 22,
    padding: 21,
    marginBottom: 30,
    overflow: "hidden",
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  // AVATAR

  avatarWrapper: {
    width: 82,
    height: 82,
    position: "relative",
  },

  avatarContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.19)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
  },

  profileInitial: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
  },

  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 3,
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: "#16A085",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  onlineIndicator: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 7,
    backgroundColor: "#35D39A",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    top: 2,
    right: 7,
  },

  profileTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  profileGreeting: {
    color: "#D9F7ED",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  profileName: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },

  profileEmail: {
    color: "#E1F1F0",
    fontSize: 11,
    marginTop: 5,
  },

  changePictureButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    marginTop: 9,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
    minHeight: 27,
  },

  changePictureText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  profileDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.23)",
    marginVertical: 18,
  },

  profileFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  profileFooterItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileFooterText: {
    color: "#E1F1F0",
    fontSize: 12,
    marginLeft: 7,
    fontWeight: "600",
  },

  editQuickButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },

  editQuickText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // SECTION HEADERS

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  sectionSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },

  // PERSONAL INFORMATION

  infoCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    marginBottom: 29,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },

  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 5,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "700",
  },

  // ACCOUNT CARD

  accountCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    marginBottom: 23,
    overflow: "hidden",
  },

  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
  },

  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  accountContent: {
    flex: 1,
  },

  accountTitle: {
    fontSize: 14,
    fontWeight: "800",
  },

  accountDescription: {
    fontSize: 11,
    marginTop: 4,
  },

  // LOGOUT

  logoutButton: {
    flexDirection: "row",
    height: 57,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },

  logoutIcon: {
    marginRight: 12,
  },

  logoutText: {
    fontSize: 14,
    fontWeight: "800",
  },

  logoutSpacer: {
    flex: 1,
  },

  // FOOTER

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 27,
    gap: 7,
  },

  footerText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
