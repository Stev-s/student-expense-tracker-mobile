
import React, { useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ImageBackground,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

const COLORS = {
  primary: '#4568F5',
  primaryDark: '#304ED0',
  background: '#F4F6FC',
  white: '#FFFFFF',
  text: '#172033',
  muted: '#8791A5',
  border: '#E5E9F2',
  input: '#F8F9FD',
};

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Entrance animations
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(35)).current;
  const logoAnimation = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),

      Animated.spring(slideAnimation, {
        toValue: 0,
        friction: 8,
        tension: 45,
        useNativeDriver: true,
      }),

      Animated.spring(logoAnimation, {
        toValue: 1,
        friction: 5,
        tension: 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing information',
        'Please enter your email and password.'
      );
      return;
    }

    try {
      setLoading(true);

      await login(email.trim(), password);

      router.replace('/');
    } catch (error) {
      Alert.alert(
        'Login failed',
        error instanceof Error
          ? error.message
          : 'Unable to log in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* FULL SCREEN BACKGROUND IMAGE */}
      <ImageBackground
        source={require('../../assets/login-background.png')}
        resizeMode="stretch"
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        {/* BLUE OVERLAY FOR BETTER READABILITY */}
        <View style={styles.backgroundOverlay} />

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnimation,
                  transform: [{ translateY: slideAnimation }],
                },
              ]}
            >

              {/* HEADER */}
              <View style={styles.header}>
                <Animated.View
                  style={[
                    styles.logoCircle,
                    {
                      transform: [{ scale: logoAnimation }],
                    },
                  ]}
                >
                  <Text style={styles.logoText}>SE</Text>
                </Animated.View>

                <Text style={styles.title}>
                  Student Expense Tracker
                </Text>

                <Text style={styles.subtitle}>
                  Take control of your money, one day at a time.
                </Text>
              </View>

              {/* LOGIN CARD */}
              <View style={styles.form}>
                <View style={styles.welcomeSection}>
                  <Text style={styles.formTitle}>
                    Welcome back!
                  </Text>

                  <Text style={styles.formSubtitle}>
                    Sign in to continue managing your finances.
                  </Text>
                </View>

                {/* EMAIL */}
                <Text style={styles.label}>Email Address</Text>

                <View
                  style={[
                    styles.inputContainer,
                    emailFocused && styles.inputFocused,
                  ]}
                >
                  <Text style={styles.inputIcon}>✉</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={COLORS.muted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    editable={!loading}
                    returnKeyType="next"
                  />
                </View>

                {/* PASSWORD */}
                <Text style={styles.label}>Password</Text>

                <View
                  style={[
                    styles.inputContainer,
                    passwordFocused && styles.inputFocused,
                  ]}
                >
                  <Text style={styles.inputIcon}>◆</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={COLORS.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />

                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    hitSlop={10}
                  >
                    <Text style={styles.showPassword}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </Pressable>
                </View>

                {/* FORGOT PASSWORD */}
                <Pressable
                  style={styles.forgotPasswordButton}
                  onPress={() => router.push('/forgot-password')}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </Pressable>

                {/* LOGIN BUTTON */}
                <Pressable
                  style={({ pressed }) => [
                    styles.loginButton,
                    pressed && !loading && styles.loginButtonPressed,
                    loading && styles.disabledButton,
                  ]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.loginButtonText}>
                      Sign In
                    </Text>
                  )}
                </Pressable>

                {/* REGISTRATION LINK */}
                <View style={styles.registerRow}>
                  <Text style={styles.registerText}>
                    Don't have an account?
                  </Text>

                  <Link href="/register" asChild>
                    <Pressable>
                      <Text style={styles.registerLink}>
                        Create Account
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              </View>

              {/* FOOTER */}
              <View style={styles.footer}>
                <Text style={styles.footerIcon}>◈</Text>

                <Text style={styles.footerText}>
                  Your money. Your goals. Your future.
                </Text>

                <Text style={styles.footerCopyright}>
                  STUDENT EXPENSE TRACKER
                </Text>
              </View>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Background image covers the entire screen
  backgroundImage: {
    flex: 1,
    width: '100%',
  },

  backgroundImageStyle: {
    width: '100%',
    height: '100%',
    opacity: 1,
  },

  // Transparent blue layer over the image
backgroundOverlay: {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: 'rgba(20, 55, 130, 0.38)',
},

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 35,
  },

  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },

  header: {
    alignItems: 'center',
    marginBottom: 32,
  },

  logoCircle: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17,
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },

  logoText: {
    color: COLORS.primary,
    fontSize: 25,
    fontWeight: '900',
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 13,
    color: '#E5EAFE',
    marginTop: 9,
    textAlign: 'center',
  },

  form: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 23,
    borderWidth: 1,
    borderColor: '#EDF0F6',
    elevation: 10,
    shadowColor: '#172033',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },

  welcomeSection: {
    marginBottom: 25,
  },

  formTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.text,
  },

  formSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 7,
    lineHeight: 20,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 9,
  },

  inputContainer: {
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: COLORS.input,
    marginBottom: 20,
  },

  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
  },

  inputIcon: {
    fontSize: 17,
    color: COLORS.primary,
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },

  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: COLORS.text,
  },

  showPassword: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },

  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: -7,
    marginBottom: 23,
  },

  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  loginButton: {
    height: 55,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
  },

  loginButtonPressed: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 0.98 }],
  },

  disabledButton: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    flexWrap: 'wrap',
  },

  registerText: {
    color: COLORS.muted,
    fontSize: 13,
  },

  registerLink: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 5,
  },

  footer: {
    alignItems: 'center',
    marginTop: 32,
  },

  footerIcon: {
    fontSize: 23,
    color: COLORS.white,
    marginBottom: 7,
  },

  footerText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },

  footerCopyright: {
    fontSize: 9,
    color: '#E5EAFE',
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: 12,
  },
});
