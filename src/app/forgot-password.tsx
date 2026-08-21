import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from "react-native";
import { router } from "expo-router";

const API_URL =
    "http://192.168.172.147:5000/api";

export default function ForgotPasswordScreen() {

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleForgotPassword = async () => {

        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
            Alert.alert(
                "Email Required",
                "Please enter your email address."
            );
            return;
        }

        try {

            setLoading(true);

            const response = await fetch(
                `${API_URL}/auth/forgot-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: cleanEmail,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {

                Alert.alert(
                    "Error",
                    data.message ||
                    "Unable to process your request."
                );

                return;
            }

            Alert.alert(
                "Check Your Email",
                "If an account exists with that email, a password reset link has been sent.",
                [
                    {
                        text: "OK",
                        onPress: () => router.back(),
                    },
                ]
            );

        } catch (error) {

            console.error(
                "Forgot password error:",
                error
            );

            Alert.alert(
                "Connection Error",
                "Unable to connect to the server. Make sure the backend is running."
            );

        } finally {

            setLoading(false);

        }
    };


    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                Forgot Password?
            </Text>

            <Text style={styles.subtitle}>
                Enter the email address associated with your
                Student Expense Tracker account.
            </Text>


            <Text style={styles.label}>
                Email Address
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
            />


            <TouchableOpacity
                style={styles.button}
                onPress={handleForgotPassword}
                disabled={loading}
            >

                {loading ? (

                    <ActivityIndicator color="#ffffff" />

                ) : (

                    <Text style={styles.buttonText}>
                        Send Reset Link
                    </Text>

                )}

            </TouchableOpacity>


            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
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
        marginBottom: 12,
        color: "#111827",
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
        marginBottom: 20,
    },

    button: {
        height: 52,
        borderRadius: 10,
        backgroundColor: "#2563eb",
        alignItems: "center",
        justifyContent: "center",
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