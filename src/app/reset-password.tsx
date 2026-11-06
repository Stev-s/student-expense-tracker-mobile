import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

const API_URL =
    Platform.OS === "web"
        ? "http://localhost:5000/api"
        : "http://192.168.172.147:5000/api";

export default function ResetPasswordScreen() {

    const { token } = useLocalSearchParams();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);


    const handleResetPassword = async () => {

        if (!token) {

            Alert.alert(
                "Invalid Link",
                "This password reset link is invalid."
            );

            return;
        }


        if (!newPassword || !confirmPassword) {

            Alert.alert(
                "Required Fields",
                "Please enter and confirm your new password."
            );

            return;
        }


        if (newPassword.length < 6) {

            Alert.alert(
                "Invalid Password",
                "Password must contain at least 6 characters."
            );

            return;
        }


        if (newPassword !== confirmPassword) {

            Alert.alert(
                "Passwords Do Not Match",
                "Please make sure both passwords are the same."
            );

            return;
        }


        try {

            setLoading(true);


            const response = await fetch(
                `${API_URL}/auth/reset-password`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        token: String(token),
                        newPassword,
                    }),
                }
            );


            const data = await response.json();


            if (!response.ok) {

                Alert.alert(
                    "Reset Failed",
                    data.message ||
                    "Unable to reset your password."
                );

                return;
            }


            Alert.alert(
                "Password Reset",
                "Your password has been reset successfully. You can now log in with your new password.",
                [
                    {
                        text: "Go to Login",
                        onPress: () => {
                            router.replace("/login");
                        },
                    },
                ]
            );


        } catch (error) {

            console.error(
                "Reset password error:",
                error
            );


            Alert.alert(
                "Connection Error",
                "Unable to connect to the server."
            );


        } finally {

            setLoading(false);

        }
    };


    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                Reset Password
            </Text>


            <Text style={styles.subtitle}>
                Create a new password for your
                Student Expense Tracker account.
            </Text>


            <Text style={styles.label}>
                New Password
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
            />


            <Text style={styles.label}>
                Confirm New Password
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
            />


            <TouchableOpacity
                style={styles.button}
                onPress={handleResetPassword}
                disabled={loading}
            >

                {loading ? (

                    <ActivityIndicator color="#ffffff" />

                ) : (

                    <Text style={styles.buttonText}>
                        Reset Password
                    </Text>

                )}

            </TouchableOpacity>


            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace("/login")}
            >

                <Text style={styles.backText}>
                    Back to Login
                </Text>

            </TouchableOpacity>

        </View>

    );
}


const styles = StyleSheet.create({

    container: {
        flex: 1,
        padding: 24,
        justifyContent: "center",
        backgroundColor: "#ffffff",
    },

    title: {
        fontSize: 30,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 12,
    },

    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: "#6b7280",
        marginBottom: 30,
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },

    input: {
        height: 52,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 18,
    },

    button: {
        height: 52,
        borderRadius: 10,
        backgroundColor: "#2563eb",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 5,
    },

    buttonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
    },

    backButton: {
        marginTop: 20,
        alignItems: "center",
    },

    backText: {
        color: "#2563eb",
        fontSize: 15,
        fontWeight: "600",
    },

});